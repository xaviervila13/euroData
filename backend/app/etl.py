"""Orquestacion del ETL: descarga del BCE y persistencia en Postgres."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from . import db, ecb

log = logging.getLogger("europrinter.etl")


def run(pool, full: bool = False) -> dict:
    """Ejecuta el ETL. Si la BD esta vacia fuerza bootstrap completo."""
    empty = db.count_obs(pool) == 0
    full = bool(full or empty)
    mode = "full" if full else "incremental"
    run_id = db.start_run(pool, mode)
    log.info("ETL %s iniciado (run %d)", mode, run_id)
    try:
        store = ecb.download_all(full)
        rows = 0
        for series, data in store.items():
            rows += db.upsert_obs(pool, series, data)
        detail = f"{len(store)} series descargadas"
        db.finish_run(pool, run_id, "success", rows=rows, detail=detail)
        log.info("ETL %s OK: %d filas", mode, rows)
        return {"status": "success", "mode": mode, "runId": run_id, "rows": rows}
    except Exception as err:  # noqa: BLE001 - se registra y se propaga
        db.finish_run(pool, run_id, "error", detail=f"{type(err).__name__}: {err}")
        log.exception("ETL %s fallo (run %d)", mode, run_id)
        raise


def write_snapshot(pool, path: str | Path) -> Path:
    """Genera un data.json de respaldo (fallback offline del frontend)."""
    payload = ecb.build_payload(db.load_store(pool))
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    tmp.replace(out)
    log.info("snapshot escrito en %s", out)
    return out
