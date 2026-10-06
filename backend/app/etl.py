"""Orquestacion del ETL: descarga de fuentes oficiales y persistencia en Postgres."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from . import db, debt, housing, inflation, payload, pensions
from .sources import damodaran, ecb

log = logging.getLogger("esproblemas.etl")


def run(pool, full: bool = False) -> dict:
    """Ejecuta el ETL. Si la BD esta vacia fuerza bootstrap completo."""
    empty = db.count_obs(pool) == 0
    full = bool(full or empty)
    mode = "full" if full else "incremental"
    run_id = db.start_run(pool, mode)
    log.info("ETL %s iniciado (run %d)", mode, run_id)
    try:
        # Cada fuente se descarga por separado: si una falla (p. ej. un 504 del BCE),
        # el resto se guarda igualmente y el run queda marcado como parcial.
        sources = {
            "ecb": lambda: ecb.download_all(full),
            "housing": housing.download_all,
            "inflation": inflation.download_all,
            "pensions": pensions.download_all,
            "debt": debt.download_all,
        }
        store: dict = {}
        failed = []
        for name, fetch in sources.items():
            try:
                store.update(fetch())
            except Exception as err:  # noqa: BLE001 - se registra y se sigue con el resto
                failed.append(name)
                log.error("fuente '%s' fallo: %s", name, err)

        if not store:
            raise RuntimeError(f"todas las fuentes fallaron: {', '.join(failed)}")

        # Metadatos (no son series temporales): referencias academicas de rentabilidad
        try:
            db.set_meta(pool, "ref:real_returns", damodaran.download_all())
        except Exception as err:  # noqa: BLE001
            failed.append("damodaran")
            log.error("metadatos de Damodaran fallaron: %s", err)

        rows = 0
        for series, data in store.items():
            rows += db.upsert_obs(pool, series, data)
        status = "success" if not failed else "partial"
        detail = f"{len(store)} series descargadas" + (f"; fallaron: {', '.join(failed)}" if failed else "")
        db.finish_run(pool, run_id, status, rows=rows, detail=detail)
        log.info("ETL %s %s: %d filas", mode, status, rows)
        return {"status": status, "mode": mode, "runId": run_id, "rows": rows, "failed": failed}
    except Exception as err:  # noqa: BLE001 - se registra y se propaga
        db.finish_run(pool, run_id, "error", detail=f"{type(err).__name__}: {err}")
        log.exception("ETL %s fallo (run %d)", mode, run_id)
        raise


def write_snapshot(pool, path: str | Path) -> Path:
    """Genera un data.json de respaldo (fallback offline del frontend)."""
    data = payload.build_payload(db.load_store(pool), db.load_meta(pool))
    out = Path(path)
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    tmp.replace(out)
    log.info("snapshot escrito en %s", out)
    return out
