"""API FastAPI de Euro Printer: sirve el payload de datos y gestiona el ETL."""

from __future__ import annotations

import logging
import os
import secrets
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from . import db, etl, payload, scheduler

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("esproblemas.api")

_state: dict = {"pool": None, "sched": None, "cache": None, "cache_ts": 0.0}
_cache_lock = threading.Lock()
PAYLOAD_TTL = float(os.environ.get("PAYLOAD_TTL_SECONDS", "300"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("arrancando ESProblemas API")
    pool = db.init()
    _state["pool"] = pool
    _state["sched"] = scheduler.start(pool)
    scheduler.bootstrap_async(pool)
    yield
    log.info("apagando ESProblemas API")
    sched = _state.get("sched")
    if sched:
        sched.shutdown(wait=False)
    pool.close()


app = FastAPI(title="ESProblemas API", version="2.1.0", lifespan=lifespan)


def _payload(force: bool = False) -> dict:
    now = time.time()
    with _cache_lock:
        if not force and _state["cache"] and now - _state["cache_ts"] < PAYLOAD_TTL:
            return _state["cache"]
    store = db.load_store(_state["pool"])
    if not store.get("bsi:m3"):
        raise HTTPException(status_code=503, detail="data not ready (bootstrap in progress)")
    payload_data = payload.build_payload(store)
    with _cache_lock:
        _state["cache"] = payload_data
        _state["cache_ts"] = time.time()
    return payload_data


@app.get("/api/data")
def api_data() -> dict:
    return _payload()


@app.get("/api/health")
def api_health() -> dict:
    pool = _state["pool"]
    if pool is None:
        return JSONResponse(status_code=503, content={"status": "starting"})
    return {
        "status": "ok",
        "obs": db.count_obs(pool),
        "latestM3": db.latest_period(pool, "bsi:m3"),
        "lastRun": db.latest_run(pool),
        "cachedAt": datetime.fromtimestamp(_state["cache_ts"], timezone.utc).isoformat()
        if _state["cache_ts"] else None,
    }


@app.post("/api/refresh")
def api_refresh(request: Request, full: bool = False) -> dict:
    token = os.environ.get("REFRESH_TOKEN", "")
    if not token:
        raise HTTPException(status_code=403, detail="refresh disabled (REFRESH_TOKEN not set)")
    provided = request.headers.get("x-refresh-token") or request.query_params.get("token") or ""
    if not secrets.compare_digest(provided, token):
        raise HTTPException(status_code=401, detail="invalid token")
    result = etl.run(_state["pool"], full=full)
    with _cache_lock:
        _state["cache"] = None
        _state["cache_ts"] = 0.0
    return result
