#!/usr/bin/env python3
"""Genera el snapshot estatico del frontend sin base de datos.

Descarga todas las fuentes oficiales (BCE, Eurostat, INE) y escribe
frontend/data/data.json, que el frontend usa como respaldo si la API no responde.

Uso:
    python3 scripts/update_snapshot.py [--out RUTA]

Para escribir en Postgres usa el backend:
    docker compose exec backend python -m app.etl_cli --full
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

from app import debt, housing, inflation, payload, pensions  # noqa: E402
from app.sources import damodaran, ecb  # noqa: E402


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    parser = argparse.ArgumentParser(description="Snapshot estatico -> data.json")
    parser.add_argument("--out", type=Path, default=REPO_ROOT / "frontend" / "data" / "data.json")
    args = parser.parse_args()

    started = time.time()
    store = {**ecb.download_all(full=True), **housing.download_all(), **inflation.download_all(), **pensions.download_all(), **debt.download_all()}
    meta = {}
    try:
        meta["ref:real_returns"] = damodaran.download_all()
    except Exception as err:  # noqa: BLE001
        print(f"aviso: metadatos de Damodaran no disponibles: {err}")
    data = payload.build_payload(store, meta)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    tmp = args.out.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    tmp.replace(args.out)

    print(f"OK: {args.out} ({args.out.stat().st_size / 1024:.1f} KB) en {time.time() - started:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
