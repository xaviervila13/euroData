"""Acceso a Postgres: pool, esquema y operaciones de datos."""

from __future__ import annotations

import logging
import os
import time

import psycopg
from psycopg_pool import ConnectionPool

log = logging.getLogger("europrinter.db")

DDL_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS obs (
        series     TEXT NOT NULL,
        period     TEXT NOT NULL,
        value      DOUBLE PRECISION NOT NULL,
        fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (series, period)
    )
    """,
    "CREATE INDEX IF NOT EXISTS obs_series_period_idx ON obs (series, period DESC)",
    """
    CREATE TABLE IF NOT EXISTS runs (
        id          BIGSERIAL PRIMARY KEY,
        started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        finished_at TIMESTAMPTZ,
        status      TEXT NOT NULL,
        mode        TEXT,
        rows        INTEGER,
        detail      TEXT
    )
    """,
]


def dsn() -> str:
    return os.environ.get(
        "DATABASE_URL",
        "postgresql://eurodata:eurodata@localhost:5432/eurodata",
    )


def wait_for_db(url: str, attempts: int = 30, delay: float = 2.0) -> None:
    for attempt in range(1, attempts + 1):
        try:
            with psycopg.connect(url, connect_timeout=5) as conn:
                conn.execute("SELECT 1")
            log.info("Postgres disponible (intento %d)", attempt)
            return
        except psycopg.OperationalError as err:
            if attempt == attempts:
                raise
            log.warning("Postgres no disponible (intento %d/%d): %s", attempt, attempts, err)
            time.sleep(delay)


def init(url: str | None = None) -> ConnectionPool:
    url = url or dsn()
    wait_for_db(url)
    pool = ConnectionPool(
        url, min_size=1, max_size=4, open=True, kwargs={"autocommit": True}
    )
    with pool.connection() as conn:
        for stmt in DDL_STATEMENTS:
            conn.execute(stmt)
    return pool


def upsert_obs(pool: ConnectionPool, series: str, data: dict) -> int:
    rows = [(series, period, value) for period, value in data.items()]
    if not rows:
        return 0
    with pool.connection() as conn, conn.cursor() as cur:
        cur.executemany(
            "INSERT INTO obs (series, period, value) VALUES (%s, %s, %s)"
            " ON CONFLICT (series, period) DO UPDATE SET value = EXCLUDED.value,"
            " fetched_at = now()",
            rows,
        )
    return len(rows)


def load_store(pool: ConnectionPool) -> dict:
    store: dict = {}
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT series, period, value FROM obs")
        for series, period, value in cur:
            store.setdefault(series, {})[period] = float(value)
    return store


def count_obs(pool: ConnectionPool) -> int:
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM obs")
        return int(cur.fetchone()[0])


def latest_period(pool: ConnectionPool, series: str) -> str | None:
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute("SELECT max(period) FROM obs WHERE series = %s", (series,))
        row = cur.fetchone()
        return row[0] if row and row[0] else None


def start_run(pool: ConnectionPool, mode: str) -> int:
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute("INSERT INTO runs (status, mode) VALUES ('running', %s) RETURNING id", (mode,))
        return int(cur.fetchone()[0])


def finish_run(pool: ConnectionPool, run_id: int, status: str, rows: int | None = None, detail: str | None = None) -> None:
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute(
            "UPDATE runs SET finished_at = now(), status = %s, rows = %s, detail = %s WHERE id = %s",
            (status, rows, (detail or "")[:1000], run_id),
        )


def latest_run(pool: ConnectionPool) -> dict | None:
    with pool.connection() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT id, started_at, finished_at, status, mode, rows, detail"
            " FROM runs ORDER BY id DESC LIMIT 1"
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            "id": row[0],
            "startedAt": row[1].isoformat() if row[1] else None,
            "finishedAt": row[2].isoformat() if row[2] else None,
            "status": row[3],
            "mode": row[4],
            "rows": row[5],
            "detail": row[6],
        }
