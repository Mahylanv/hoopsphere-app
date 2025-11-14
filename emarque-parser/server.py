# server.py
from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import io, re, os
import numpy as np
import cv2
import pytesseract
import pypdfium2 as pdfium

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE = os.path.dirname(__file__)
DBG_PATH = os.path.join(BASE, "debug_overlay.png")

# ---------------- Utils ----------------
def ensure(cond, code, msg):
    if not cond:
        raise HTTPException(code, msg)

def norm_txt(s: str) -> str:
    s = (s or "").lower()
    s = (s.replace("é","e").replace("è","e").replace("ê","e")
            .replace("à","a").replace("ù","u").replace("û","u")
            .replace("î","i").replace("ï","i").replace("ô","o")
            .replace("ç","c"))
    s = re.sub(r"[^\w ]+", " ", s)
    return re.sub(r"\s+"," ", s).strip()

# libellés tolérés
CANON = {
    "jersey": ["n", "n maillot", "no maillot", "n°", "n° maillot", "numero"],
    "name": ["nom", "nom prenom", "nom prénom", "joueur", "joueurs"],
    "starter": ["5 de depart", "5 de départ", "5 depart"],
    "play_time": ["tps de jeu", "temps de jeu", "tps jeu", "tps", "temps"],
    "points": ["nb pts marques", "nb pts marqués", "pts", "total pts", "nb pts", "points"],
    "shots_made": ["nb tirs reussis", "nb tirs réussis", "tirs reussis", "tirs réussis"],
    "threes": ["3 pts reussis", "3 pts réussis", "3pts", "3pts reussis"],
    "two_int": ["2 int reussis", "2 int réussis", "2 int"],
    "two_ext": ["2 ext reussis", "2 ext réussis", "2 ext"],
    "ft_made": ["lf reussis", "lf réussis", "lancers francs reussis", "lf"],
    "fouls_committed": ["ftes com", "fautes com", "fautes commises", "fautes"],
}

DEFAULT_COL_ORDER = [
    "jersey","name","starter","play_time",
    "points","shots_made","threes","two_int","two_ext","ft_made","fouls_committed"
]
NUM_KEYS = ["points","shots_made","threes","two_int","two_ext","ft_made","fouls_committed"]

BAD_NAME_TOKENS = {
    "mi-temps","mi temps","prolongation","prolongations","prolong","prolo",
    "entraineur","entraîneur","totaux","totaux equipe","total","total equipe",
    "depart","départ",
    "a","c","ipe","de","—","-","ongation",":","locaux","visiteurs","nom prénom","nom prenom",
    "es","ès","résumé","resume","equipe","équipe"
}

def clamp_stat(key, v):
    v = int(v or 0)
    if key == "fouls_committed": return max(0, min(5, v))
    if key in ("threes","two_int","two_ext","ft_made","shots_made"): return max(0, min(40, v))
    if key == "points": return max(0, min(99, v))
    return max(0, v)

# ---------------- OCR helpers ----------------
DIGIT_CFG = "--oem 1 --psm 10 -l eng -c tessedit_char_whitelist=0123456789"
FOUL_CFG  = "--oem 1 --psm 10 -l eng -c tessedit_char_whitelist=012345 -c classify_bln_numeric_mode=1"

def ocr_text(img):
    if img is None or img.size == 0:
        return ""
    try:
        return pytesseract.image_to_string(img, config="--oem 1 --psm 7 -l fra", timeout=8).strip()
    except pytesseract.TesseractError:
        return ""

def ocr_digit_once(img, inv=None):
    if img is None or img.size == 0:
        return None
    g = img if len(img.shape)==2 else cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    if inv is True:
        g = cv2.GaussianBlur(g, (3,3), 0)
        t = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
    elif inv is False:
        t = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    else:
        t = g
    try:
        txt = pytesseract.image_to_string(t, config=DIGIT_CFG, timeout=6).strip()
    except pytesseract.TesseractError:
        return None
    txt = re.sub(r"\D", "", txt)
    if txt.isdigit():
        return int(txt)
    return None

def ocr_digit_vote(cell):
    if cell is None or cell.size == 0:
        return 0
    cands = []
    try:
        txt = pytesseract.image_to_string(cell, config=DIGIT_CFG, timeout=5).strip()
        txt = re.sub(r"\D","",txt)
        if txt.isdigit(): cands.append(int(txt))
    except pytesseract.TesseractError:
        pass
    v = ocr_digit_once(cell, inv=False)
    if v is not None: cands.append(v)
    v = ocr_digit_once(cell, inv=True)
    if v is not None: cands.append(v)
    if not cands:
        return 0
    vals, counts = np.unique(np.array(cands), return_counts=True)
    return int(vals[np.argmax(counts)])

# ---- OCR spécial fautes (0..5) ----
def _holes_and_area(bin_inv):
    """Retourne (nb_trous, ratio_surface_trous) sur une image 'digit blanc / fond noir'."""
    if bin_inv is None or bin_inv.size == 0:
        return 0, 0.0
    img = bin_inv
    if img.ndim == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, img = cv2.threshold(img, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)

    contours, hierarchy = cv2.findContours(img, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    if hierarchy is None:
        return 0, 0.0

    holes = 0
    holes_area = 0
    total_area = img.shape[0] * img.shape[1]
    for idx, h in enumerate(hierarchy[0]):
        if h[3] != -1:  # trou
            holes += 1
            holes_area += cv2.contourArea(contours[idx])
    ratio = (holes_area / float(total_area)) if total_area else 0.0
    return holes, ratio

def ocr_fouls(cell_bin):
    """
    Lecture robuste des fautes (0..5) avec vote multi-variantes.
    Heuristique finale : si Tesseract lit 0 mais qu'il n'y a pas de trou central significatif → 4.
    """
    if cell_bin is None or cell_bin.size == 0:
        return 0

    g  = cell_bin if len(cell_bin.shape)==2 else cv2.cvtColor(cell_bin, cv2.COLOR_BGR2GRAY)
    b  = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
    bi = cv2.threshold(g, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]

    variants = [
        g, b, bi,
        cv2.bitwise_not(b), cv2.bitwise_not(bi),
        cv2.resize(bi, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST),
        cv2.resize(bi, None, fx=3, fy=3, interpolation=cv2.INTER_NEAREST),
    ]

    reads = []
    for img in variants:
        try:
            s = pytesseract.image_to_string(img, config=FOUL_CFG, timeout=5).strip()
            s = re.sub(r"\D", "", s)
            if s.isdigit():
                v = int(s)
                if 0 <= v <= 5:
                    reads.append(v)
        except pytesseract.TesseractError:
            pass

    # vote majoritaire
    val = 0
    if reads:
        vals, counts = np.unique(np.array(reads), return_counts=True)
        val = int(vals[np.argmax(counts)])

    # 0 vs 4 : un vrai "0" présente généralement un trou central non négligeable
    holes, hole_ratio = _holes_and_area(bi)  # digit blanc sur fond noir
    if val == 0 and (holes == 0 or hole_ratio < 0.06):
        val = 4

    return clamp_stat("fouls_committed", val)

# ---------------- Raster helpers ----------------
def render_highres_bgr(data: bytes, scale=6):
    doc = pdfium.PdfDocument(io.BytesIO(data))
    page = doc.get_page(0)
    bmp = page.render(scale=scale)
    return cv2.cvtColor(np.array(bmp.to_pil()), cv2.COLOR_RGB2BGR)

def safe_cell_bin(no_lines, y1, y2, x1, x2, pad_x=6, pad_y=3):
    x1 += pad_x; x2 -= pad_x; y1 += pad_y; y2 -= pad_y
    if x2 <= x1 or y2 <= y1:
        return None, None
    cell_bin = no_lines[y1:y2, x1:x2]
    if cell_bin is None or cell_bin.size == 0:
        return None, None
    h, w = cell_bin.shape
    if h > 4 and w > 4:
        cell_bin = cell_bin[1:-1, 1:-1]
    cell_txt = cv2.bitwise_not(cell_bin)
    return cell_bin, cell_txt

# ---------------- Réconciliation des stats ----------------
def reconcile_stats(row):
    t0 = clamp_stat("threes",          int(row.get("threes",0) or 0))
    i0 = clamp_stat("two_int",         int(row.get("two_int",0) or 0))
    e0 = clamp_stat("two_ext",         int(row.get("two_ext",0) or 0))
    f0 = clamp_stat("ft_made",         int(row.get("ft_made",0) or 0))
    s0 = clamp_stat("shots_made",      int(row.get("shots_made",0) or 0))
    p0 = clamp_stat("points",          int(row.get("points",0) or 0))

    def neigh_num(v, lo=0, hi=15, width=2):
        return range(max(lo, v - width), min(hi, v + width) + 1)

    Ts = list(neigh_num(t0, hi=10))
    Is = list(neigh_num(i0, hi=12))
    Es = list(neigh_num(e0, hi=12))
    Fs = sorted(set(neigh_num(f0, hi=12)) | {0,2,4,6,8,10,12})

    def shots(t,i,e): return t + i + e
    def pts(t,i,e,f): return 3*t + 2*(i+e) + f
    def l1_ocr(t,i,e,f): return abs(t-t0)+abs(i-i0)+abs(e-e0)+abs(f-f0)

    exact_best = None
    approx_best = None
    W_PTS, W_SHOTS, W_OCR = 8, 6, 1

    for t in Ts:
        for i in Is:
            for e in Es:
                for f in Fs:
                    sm = shots(t,i,e)
                    p  = pts(t,i,e,f)
                    if sm == s0 and p == p0:
                        cand = (l1_ocr(t,i,e,f), (t,i,e,f))
                        if exact_best is None or cand < exact_best:
                            exact_best = cand
                        continue
                    score = (
                        W_PTS   * abs(p  - p0) +
                        W_SHOTS * abs(sm - s0) +
                        W_OCR   * l1_ocr(t,i,e,f)
                    )
                    cand = (score, (t,i,e,f))
                    if approx_best is None or score < approx_best[0]:
                        approx_best = cand

    if exact_best is not None:
        t,i,e,f = exact_best[1]
    else:
        t,i,e,f = approx_best[1]

    row["threes"]  = t
    row["two_int"] = i
    row["two_ext"] = e
    row["ft_made"] = f
    row["shots_made"] = clamp_stat("shots_made", t + i + e)
    row["points"]     = clamp_stat("points", 3*t + 2*(i+e) + f)

# ---------------- Grid OCR principal ----------------
def grid_ocr_full(
    data: bytes,
    debug=False,
    scale=7,
    peak_frac=0.18,
    save_cells=False,
    force_order=True
):
    bgr = render_highres_bgr(data, scale=scale)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    bin0 = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 31, 9
    )
    H, W = bin0.shape

    vk = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(40, H//36)))
    hk = cv2.getStructuringElement(cv2.MORPH_RECT, (max(40, W//36), 1))
    v = cv2.morphologyEx(bin0, cv2.MORPH_OPEN, vk, iterations=1)
    h = cv2.morphologyEx(bin0, cv2.MORPH_OPEN, hk, iterations=1)
    lines = cv2.bitwise_or(v, h)
    no_lines = cv2.bitwise_and(bin0, cv2.bitwise_not(lines))

    ver = lines.sum(axis=0)
    hor = lines.sum(axis=1)

    def peaks(a, frac):
        thr = a.max()*frac if a.max()>0 else 1
        idx = np.where(a > thr)[0]
        groups, cur = [], []
        for i in idx:
            if not cur or i == cur[-1] + 1: cur.append(i)
            else: groups.append((cur[0], cur[-1])); cur = [i]
        if cur: groups.append((cur[0], cur[-1]))
        return [int((x+y)//2) for x,y in groups]

    xs = sorted(set(peaks(ver, peak_frac)))
    ys = sorted(set(peaks(hor, peak_frac)))
    if len(xs) < 5 or len(ys) < 8:
        xs = sorted(set(peaks(ver, max(0.10, peak_frac - 0.05))))
        ys = sorted(set(peaks(hor, max(0.10, peak_frac - 0.05))))
    if len(xs) < 5 or len(ys) < 8:
        return [], []

    # mapping colonnes
    col_keys = {}
    if force_order:
        for i in range(min(len(xs) - 1, len(DEFAULT_COL_ORDER))):
            col_keys[i] = DEFAULT_COL_ORDER[i]
    else:
        hy1, hy2 = ys[0]+2, ys[1]-2
        header_map = {}
        widths = []
        for i in range(len(xs) - 1):
            x1, x2 = xs[i]+2, xs[i+1]-2
            cell = cv2.bitwise_not(no_lines[hy1:hy2, x1:x2])
            key_txt = norm_txt(ocr_text(cell))
            mapped = None
            for k, alts in CANON.items():
                if key_txt in alts or any(a.startswith(key_txt) and len(key_txt) >= 3 for a in alts):
                    mapped = k; break
            if mapped and mapped not in header_map.values():
                header_map[i] = mapped
            widths.append(((x2-x1), i))
        if not header_map:
            for idx, col in enumerate(DEFAULT_COL_ORDER[:len(xs)-1]):
                header_map[idx] = col
        if "name" not in header_map.values() and widths:
            header_map[max(widths)[1]] = "name"
        if "jersey" not in header_map.values():
            left3 = list(range(min(3, len(xs)-1)))
            if left3:
                narrow = min(left3, key=lambda j: xs[j+1]-xs[j] if j < len(xs)-1 else 1)
                header_map[narrow] = "jersey"
        for i in range(len(xs)-1):
            if i in header_map and header_map[i] not in col_keys.values():
                col_keys[i] = header_map[i]

    if save_cells:
        base_dir = os.path.join(BASE, "debug_cells")
        os.makedirs(base_dir, exist_ok=True)

    mid = H // 2

    def parse_rows(y_start, y_end, half_name):
        players = []
        row_idx = 0
        for r in range(1, len(ys) - 1):
            y1, y2 = ys[r] + 1, ys[r+1] - 1
            if y2 <= y1 or y2 < y_start or y1 > y_end:
                continue

            row, seen = {}, False

            for i in range(len(xs) - 1):
                if i not in col_keys:
                    continue
                cell_bin, cell_txt = safe_cell_bin(no_lines, y1, y2, xs[i], xs[i+1], pad_x=6, pad_y=3)
                if cell_bin is None:
                    continue

                key = col_keys[i]

                if key == "name":
                    t = ocr_text(cell_txt)
                    row["name"] = t
                    seen |= bool(t.strip())
                    n = norm_txt(t)
                    if n in BAD_NAME_TOKENS or "depart" in n or n == "nom prenom":
                        row = {}
                        break

                elif key == "jersey":
                    v = ocr_digit_vote(cell_bin)
                    row["jersey"] = v if (v > 0 and v <= 99) else None
                    seen |= bool(v)

                elif key == "starter":
                    n = norm_txt(ocr_text(cell_txt))
                    row["starter"] = ("x" in n) or ("×" in n) or ("x" in n.replace(" ", ""))

                elif key == "play_time":
                    try:
                        s = pytesseract.image_to_string(
                            cell_txt, config="--oem 1 --psm 7 -l eng -c tessedit_char_whitelist=0123456789:",
                            timeout=6
                        ).strip().replace(" ", "")
                    except pytesseract.TesseractError:
                        s = ""
                    m = re.search(r"(\d{1,2})[:hH](\d{2})", s) or re.search(r"(\d{1,2})(\d{2})$", re.sub(r"\D","",s))
                    row["play_time"] = f"{int(m.group(1)):02d}:{int(m.group(2)):02d}" if m else ""

                elif key in NUM_KEYS:
                    if key == "fouls_committed":
                        v = ocr_fouls(cell_bin)
                    else:
                        v = ocr_digit_vote(cell_bin)
                    row[key] = clamp_stat(key, v)
                    seen |= bool(v)

                if save_cells and row_idx < 3:
                    out_dir = os.path.join(BASE, "debug_cells", half_name, f"row{row_idx}")
                    os.makedirs(out_dir, exist_ok=True)
                    cv2.imwrite(os.path.join(out_dir, f"{i:02d}_{key}.png"), cell_txt)

            if not (row.get("name") or row.get("jersey") is not None or seen):
                continue

            reconcile_stats(row)

            for k in NUM_KEYS:
                row[k] = clamp_stat(k, int(row.get(k,0) or 0))

            players.append(row)
            row_idx += 1
        return players

    teamA = parse_rows(0, mid - 1, "top")
    teamB = parse_rows(mid, H - 1, "bottom")

    if debug:
        vis = cv2.cvtColor(no_lines, cv2.COLOR_GRAY2BGR)
        for i in range(len(xs) - 1):
            cv2.line(vis, (xs[i], 0), (xs[i], H - 1), (0, 255, 0), 1)
        for j in range(len(ys) - 1):
            cv2.line(vis, (0, ys[j]), (W - 1, ys[j]), (255, 0, 0), 1)
        cv2.imwrite(DBG_PATH, vis)

    return teamA, teamB

# ---------------- nettoyage final ----------------
def clean_players(players):
    cleaned = []
    for p in players:
        name_raw = p.get("name","") or ""
        name_norm = norm_txt(name_raw)
        jersey = p.get("jersey")

        if not name_norm and jersey is None:
            continue
        if name_norm in BAD_NAME_TOKENS:
            continue
        if any(tok in name_norm for tok in ("mi temps","mi-temps","prolong")):
            continue
        if "entraineur" in name_norm or "entraîneur" in name_norm:
            continue
        if len(name_norm) <= 1:
            continue
        if "depart" in name_norm:
            continue
        if name_norm == "nom prenom":
            continue

        if jersey is not None:
            try:
                jersey = int(jersey)
                if not (0 < jersey <= 99):
                    jersey = None
            except:
                jersey = None
        p["jersey"] = jersey

        for k in NUM_KEYS:
            p[k] = clamp_stat(k, int(p.get(k,0) or 0))

        # supprime probables totaux d'équipe parasites
        if p["jersey"] is None and p["points"] >= 25:
            parts = p.get("threes",0) + p.get("two_int",0) + p.get("two_ext",0)
            if abs(parts - p.get("shots_made",0)) > 2:
                continue

        cleaned.append(p)

    # dédoublonnage «max»
    uniq = {}
    for p in cleaned:
        key = (norm_txt(p.get("name","")), p.get("jersey"))
        if key not in uniq:
            uniq[key] = p
        else:
            for k in NUM_KEYS:
                uniq[key][k] = max(uniq[key][k], p[k])

    return list(uniq.values())

# ---------------- API ----------------
@app.get("/__health")
def health():
    return {"ok": True}

@app.post("/parse-emarque")
async def parse_emarque(
    file: UploadFile = File(...),
    debug: int = Query(0),
    mode: str = Query("grid"),
    scale: int = Query(7, ge=2, le=10),
    frac: float = Query(0.18, ge=0.05, le=0.5),
    save: int = Query(0),
    force_order: int = Query(1),
):
    try:
        ensure(file.filename.lower().endswith(".pdf"), 400, "Le champ 'file' doit être un PDF")
        data = await file.read()
        ensure(data, 400, "Fichier vide")

        teamA, teamB = grid_ocr_full(
            data,
            debug=bool(debug),
            scale=scale,
            peak_frac=frac,
            save_cells=bool(save),
            force_order=bool(force_order),
        )

        teamA = clean_players(teamA)
        teamB = clean_players(teamB)

        return {
            "ok": True,
            "teams": [
                {"name": "Locaux",   "players": teamA},
                {"name": "Visiteurs","players": teamB}
            ],
            "debug_overlay": ("saved to debug_overlay.png" if debug else None)
        }
    except HTTPException as he:
        return JSONResponse({"ok": False, "error": he.detail}, status_code=he.status_code)
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)
