#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${PARSER_PORT:-8000}"
EXPO_CMD="${EXPO_CMD:-npx expo start}"
UVICORN_CMD="${UVICORN_CMD:-python3 -m uvicorn server:app --host 0.0.0.0 --port ${PORT}}"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
NGROK_LOG="${NGROK_LOG:-$ROOT/.ngrok.log}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Commande manquante: $1 — $2" >&2
    exit 1
  fi
}

cleanup() {
  [[ -n "${NGROK_PID:-}" ]] && kill "$NGROK_PID" >/dev/null 2>&1 || true
  [[ -n "${UVICORN_PID:-}" ]] && kill "$UVICORN_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

require_cmd python3 "installe Python 3"
require_cmd ngrok "installe ngrok (https://ngrok.com/download)"

echo "Lancement du parser FastAPI sur le port ${PORT}..."
(cd "$ROOT/emarque-parser" && $UVICORN_CMD) &
UVICORN_PID=$!

echo "Ouverture du tunnel ngrok..."
ngrok http "$PORT" --log=stdout >"$NGROK_LOG" 2>&1 &
NGROK_PID=$!

TUNNEL_URL=""
for _ in {1..20}; do
  sleep 1
  TUNNEL_URL="$(python3 - <<'PY'
import json
import urllib.request

try:
    with urllib.request.urlopen("http://127.0.0.1:4040/api/tunnels") as resp:
        data = json.load(resp)
    for t in data.get("tunnels", []):
        url = t.get("public_url", "")
        if url.startswith("https://"):
            print(url)
            raise SystemExit
except Exception:
    pass
PY
)"
  if [[ -n "$TUNNEL_URL" ]]; then
    break
  fi
done

if [[ -z "$TUNNEL_URL" ]]; then
  echo "Impossible de récupérer l'URL ngrok (voir ${NGROK_LOG}). Passage en mode réseau local." >&2
  [[ -n "${NGROK_PID:-}" ]] && kill "$NGROK_PID" >/dev/null 2>&1 || true

  LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
  if [[ -z "$LAN_IP" ]]; then
    LAN_IP="$(ip route get 1.1.1.1 2>/dev/null | awk 'NR==1 {print $7}')"
  fi
  if [[ -z "$LAN_IP" ]]; then
    LAN_IP="127.0.0.1"
  fi
  TUNNEL_URL="http://${LAN_IP}:${PORT}"
  echo "URL locale retenue: ${TUNNEL_URL}"
fi

API_URL="${TUNNEL_URL%/}/parse-emarque"
echo "URL du parser: ${API_URL}"

python3 - "$ENV_FILE" "$API_URL" <<'PY'
import sys
import pathlib

env_path = pathlib.Path(sys.argv[1])
api_url = sys.argv[2]

lines = env_path.read_text().splitlines() if env_path.exists() else []
out = []
written = False

for line in lines:
    if line.startswith("EXPO_PUBLIC_EMARQUE_URL="):
        out.append(f"EXPO_PUBLIC_EMARQUE_URL={api_url}")
        written = True
    else:
        out.append(line)

if not written:
    out.append(f"EXPO_PUBLIC_EMARQUE_URL={api_url}")

env_path.write_text("\n".join(out).rstrip("\n") + "\n")
PY

rel_env="${ENV_FILE/$ROOT\//}"
echo "EXPO_PUBLIC_EMARQUE_URL mis à jour dans ${rel_env}"
echo "Démarrage d'Expo..."

cd "$ROOT"
EXPO_PUBLIC_EMARQUE_URL="$API_URL" $EXPO_CMD
