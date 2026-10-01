"""Scheduler del ETL (APScheduler) con bootstrap al arrancar."""

from __future__ import annotations

import logging
import os
import threading
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from . import db, etl

log = logging.getLogger("europrinter.scheduler")

_lock = threading.Lock()
STALE_DAYS = int(os.environ.get("ETL_STALE_DAYS", "40"))


def _job(pool, full: bool, reason: str) -> None:
    if not _lock.acquire(blocking=False):
        log.warning("ETL ya en curso; se salta la ejecucion (%s)", reason)
        return
    try:
        etl.run(pool, full=full)
    except Exception:  # noqa: BLE001 - el run queda marcado como error en la BD
        log.exception("ETL fallo (%s)", reason)
    finally:
        _lock.release()


def is_stale(pool) -> bool:
    last = db.latest_period(pool, "bsi:m3")
    if not last:
        return True
    last_date = datetime.strptime(last, "%Y-%m").replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - last_date).days > STALE_DAYS


def bootstrap_async(pool) -> None:
    """Al arrancar: si la BD esta vacia o los datos son viejos, carga en background."""
    if db.count_obs(pool) == 0:
        log.info("BD vacia: lanzando bootstrap completo")
        threading.Thread(target=_job, args=(pool, True, "bootstrap-full"), daemon=True).start()
    elif is_stale(pool):
        log.info("Datos stale (>%d dias): lanzando ETL incremental", STALE_DAYS)
        threading.Thread(target=_job, args=(pool, False, "bootstrap-stale"), daemon=True).start()


def start(pool) -> BackgroundScheduler:
    hour = int(os.environ.get("ETL_CRON_HOUR", "6"))
    sched = BackgroundScheduler(timezone=timezone.utc)
    sched.add_job(
        _job,
        CronTrigger(hour=hour, minute=0),
        args=[pool, False, "cron"],
        id="daily-etl",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=3600,
    )
    sched.start()
    log.info("scheduler iniciado (ETL diario a las %02d:00 UTC)", hour)
    return sched
