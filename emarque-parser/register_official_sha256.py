#!/usr/bin/env python3
import argparse
import hashlib
from pathlib import Path


def normalize_sha256(value: str) -> str:
    s = value.strip().lower()
    if len(s) == 64 and all(ch in "0123456789abcdef" for ch in s):
        return s
    return ""


def read_registry(path: Path) -> set[str]:
    hashes: set[str] = set()
    if not path.exists():
        return hashes
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.split("#", 1)[0].strip()
        digest = normalize_sha256(line)
        if digest:
            hashes.add(digest)
    return hashes


def sha256_file(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as fh:
        header = fh.read(5)
        if header != b"%PDF-":
            raise ValueError(f"{path} n'est pas un PDF valide")
        hasher.update(header)
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def main():
    parser = argparse.ArgumentParser(description="Ajoute des SHA-256 PDF au registre FFBB")
    parser.add_argument("pdfs", nargs="+", help="PDFs officiels a certifier")
    parser.add_argument(
        "--registry",
        default="official_ffbb_sha256.txt",
        help="Chemin du registre SHA-256",
    )
    args = parser.parse_args()

    registry_path = Path(args.registry)
    known_hashes = read_registry(registry_path)
    new_hashes: set[str] = set()

    for raw_path in args.pdfs:
        pdf_path = Path(raw_path)
        digest = sha256_file(pdf_path)
        new_hashes.add(digest)
        print(f"{pdf_path}: {digest}")

    all_hashes = sorted(known_hashes | new_hashes)
    header = [
        "# SHA-256 autorises pour les PDFs officiels FFBB.",
        "# Un hash hexadecimal en minuscules par ligne.",
        "# Fichier genere par register_official_sha256.py.",
        "",
    ]
    registry_path.write_text("\n".join(header + all_hashes) + "\n", encoding="utf-8")
    print(f"registre mis a jour: {registry_path} ({len(all_hashes)} hashes)")


if __name__ == "__main__":
    main()
