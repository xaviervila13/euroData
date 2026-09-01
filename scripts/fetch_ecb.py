#!/usr/bin/env python3
"""
ECB Money Printer - ETL.

Descarga datos del ECB Data Portal API (https://data.ecb.europa.eu/),
los almacena en SQLite y genera data/data.json para el frontend.

- Agregados monetarios eurozona (dataset BSI): M1, M2, M3 (mensual, desde 1980).
- HICP (inflacion): indices por categoria (base 2015=100 hasta dic-2025 en el
  dataset ICP, y base 2025=100 desde 2024 en el nuevo dataset HICP). Ambos se
  encadenan en dic-2025 para obtener una serie continua.

Uso:
    python3 scripts/fetch_ecb.py            # update incremental (ultimas obs)
    python3 scripts/fetch_ecb.py --full     # recarga historico completo
"""

import argparse
import csv
import io
import json
import sqlite3
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API_BASE = "https://data-api.ecb.europa.eu/service/data"
USER_AGENT = "ecb-money-printer/1.0 (data tracker, contact via GitHub)"
AVG_MONTH_SECONDS = 2_629_800  # 30.44 dias (media del mes gregoriano)

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB = REPO_ROOT / "data" / "history.sqlite"
DEFAULT_OUT = REPO_ROOT / "data" / "data.json"

# ── Configuracion de series ──────────────────────────────────────────────────
# Agregados monetarios (millones de EUR, stocks fin de mes, ajustado dia laborable)
BSI_SERIES = {
    "m1": ("BSI", "M.U2.Y.V.M10.X.1.U2.2300.Z01.E"),
    "m2": ("BSI", "M.U2.Y.V.M20.X.1.U2.2300.Z01.E"),
    "m3": ("BSI", "M.U2.Y.V.M30.X.1.U2.2300.Z01.E"),
}
BSI_START = "1980-01"

# Categorias HICP de la eurozona: (codigo ECOICP, nombre ES, nombre EN)
HICP_CATEGORIES = [
    ("000000", "Índice general", "All items"),
    ("011000", "Alimentación", "Food"),
    ("045000", "Electricidad y gas", "Electricity & gas"),
    ("041100", "Alquiler de vivienda", "Rents"),
    ("070000", "Transporte", "Transport"),
    ("111000", "Restaurantes y bares", "Restaurants & cafés"),
]
# Dataset legacy ICP (base 2015=100) y nuevo dataset HICP (base 2025=100).
# Corte: el ICP legacy termina en 2025-12 (cambio metodologico HICP feb-2026).
ICP_OLD_PREFIX = "ICP"   # clave: M.U2.N.{code}.4.{suffix}
ICP_NEW_PREFIX = "HICP"  # clave: M.U2.N.{code}.4D0.{suffix}
OLD_BREAK = "2025-12"
HICP_START_OLD = "1995-01"
HICP_START_NEW = "2024-01"

# Slider de anos para la seccion de precios + "ahora"
SLIDER_YEARS = [1996, 1999, 2002, 2008, 2015, 2020]

# Articulos emblematicos (precios aproximados, zona euro; editar a mano)
EMBLEMATIC_ITEMS = [
    {
        "id": "coffee", "icon": "coffee", "unit": "€", "approx": True,
        "es": "Café en cafetería", "en": "Coffee in a café",
        "prices": [0.85, 0.90, 1.00, 1.20, 1.30, 1.45, 1.90],
    },
    {
        "id": "beer", "icon": "beer", "unit": "€", "approx": True,
        "es": "Cerveza 0,5 l en bar", "en": "0.5 l beer in a bar",
        "prices": [1.20, 1.25, 1.35, 1.60, 1.80, 2.00, 2.60],
    },
    {
        "id": "gas", "icon": "gas", "unit": "€/l", "approx": True,
        "es": "Gasolina 95 (litro)", "en": "Petrol 95 (per litre)",
        "prices": [0.78, 0.72, 0.88, 1.30, 1.35, 1.15, 1.68],
    },
    {
        "id": "cinema", "icon": "film", "unit": "€", "approx": True,
        "es": "Entrada de cine", "en": "Cinema ticket",
        "prices": [3.60, 3.80, 4.20, 6.00, 7.00, 7.50, 9.50],
    },
]


def log(msg: str) -> None:
    print(msg, flush=True)


def warn(msg: str) -> None:
    print(f"WARNING: {msg}", flush=True)


# ── Descarga ─────────────────────────────────────────────────────────────────
def fetch_series(flow: str, key: str, params: dict, retries: int = 3) -> dict:
    """Llama a la API SDMX y devuelve {periodo: valor}. Levanta excepcion si falla."""
    url = f"{API_BASE}/{flow}/{key}?{urllib.parse.urlencode(params)}"
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read().decode("utf-8")
            out = {}
            for row in csv.DictReader(io.StringIO(raw)):
                period = row.get("TIME_PERIOD")
                value = row.get("OBS_VALUE")
                if period and value not in (None, "", "NaN"):
                    out[period] = float(value)
            return out
        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as err:
            last_err = err
            wait = 2 * attempt
            warn(f"intento {attempt}/{retries} fallo para {flow}/{key}: {err} (reintento en {wait}s)")
            time.sleep(wait)
    raise RuntimeError(f"No se pudo descargar {flow}/{key}: {last_err}")


# ── Base de datos ────────────────────────────────────────────────────────────
def open_db(path: Path) -> sqlite3.Connection:
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS obs ("
        " series TEXT NOT NULL,"
        " period TEXT NOT NULL,"
        " value REAL NOT NULL,"
        " fetched_at TEXT NOT NULL,"
        " PRIMARY KEY (series, period))"
    )
    conn.commit()
    return conn


def upsert(conn: sqlite3.Connection, series: str, data: dict) -> int:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    conn.executemany(
        "INSERT INTO obs (series, period, value, fetched_at) VALUES (?, ?, ?, ?)"
        " ON CONFLICT(series, period) DO UPDATE SET value = excluded.value,"
        " fetched_at = excluded.fetched_at",
        [(series, p, v, now) for p, v in data.items()],
    )
    conn.commit()
    return len(data)


def read_series(conn: sqlite3.Connection, series: str) -> dict:
    rows = conn.execute("SELECT period, value FROM obs WHERE series = ? ORDER BY period", (series,)).fetchall()
    return {p: v for p, v in rows}


# ── Encadenado HICP (2015=100 -> 2025=100) ───────────────────────────────────
def chain_index(old: dict, new: dict) -> dict:
    """Encadena el indice nuevo (2025=100) sobre el legacy (2015=100) usando
    el solapamiento en 2025-12 como ancla."""
    out = dict(old)
    anchor_new, anchor_old = new.get(OLD_BREAK), old.get(OLD_BREAK)
    if anchor_new and anchor_old and anchor_new > 0:
        factor = anchor_old / anchor_new
        out.update({p: v * factor for p, v in new.items() if p > OLD_BREAK})
    else:
        warn("no hay solapamiento para encadenar HICP; concatenando sin ajuste")
        out.update({p: v for p, v in new.items() if p > OLD_BREAK})
    return out


# ── Descarga e ingesta ───────────────────────────────────────────────────────
def download(conn: sqlite3.Connection, full: bool) -> None:
    if full:
        log("Modo --full: recargando historicos completos...")
    else:
        log("Modo incremental (ultimas observaciones)...")

    # Monetarios
    for name, (flow, key) in BSI_SERIES.items():
        params = {"format": "csvdata"}
        if full:
            params["startPeriod"] = BSI_START
        else:
            params["lastNObservations"] = 14
        data = fetch_series(flow, key, params)
        n = upsert(conn, f"bsi:{name}", data)
        latest = max(data) if data else "-"
        log(f"  bsi:{name}: {n} obs (ultima {latest})")

    # HICP legacy y nuevo
    for code, _, _ in HICP_CATEGORIES:
        for suffix, start in (("INX", HICP_START_OLD), ("ANR", HICP_START_OLD)):
            params = {"format": "csvdata", "startPeriod": start} if full else {"format": "csvdata", "lastNObservations": 14}
            data = fetch_series(ICP_OLD_PREFIX, f"M.U2.N.{code}.4.{suffix}", params)
            upsert(conn, f"icp_old:{code}:{suffix}", data)
        for suffix, start in (("INX", HICP_START_NEW), ("ANR", HICP_START_NEW)):
            params = {"format": "csvdata", "startPeriod": start} if full else {"format": "csvdata", "lastNObservations": 14}
            data = fetch_series(ICP_NEW_PREFIX, f"M.U2.N.{code}.4D0.{suffix}", params)
            upsert(conn, f"icp_new:{code}:{suffix}", data)
    log(f"  hicp: {len(HICP_CATEGORIES)} categorias x INX/ANR x legacy/nuevo")


# ── Generacion de data.json ──────────────────────────────────────────────────
def sorted_items(data: dict) -> list:
    return [(p, data[p]) for p in sorted(data)]


def build_payload(conn: sqlite3.Connection) -> dict:
    now_iso = datetime.now(timezone.utc).isoformat(timespec="seconds")

    # ── Monetarios ──
    monetary = {}
    for name in BSI_SERIES:
        raw = read_series(conn, f"bsi:{name}")
        if not raw:
            raise RuntimeError(f"serie bsi:{name} vacia; ejecuta con --full")
        hist = [[p, round(v, 1)] for p, v in sorted_items(raw)]
        entry = {"history": hist}
        if name == "m3":
            base_period, base_val = hist[-1]
            prev_period, prev_val = hist[-2] if len(hist) > 1 else (None, None)
            # Ritmo suavizado: media de los ultimos 3 deltas mensuales
            # (evita que un dato puntual estacional dispare o invierta el contador).
            deltas = [hist[i][1] - hist[i - 1][1] for i in range(max(1, len(hist) - 3), len(hist))]
            avg_delta = sum(deltas) / len(deltas)
            if prev_val:
                delta_ratio = abs(base_val - prev_val) / prev_val
                if delta_ratio > 0.025:
                    warn(f"salto mensual de M3 inusual ({delta_ratio:.1%}); revisar revision de datos")
                per_second = avg_delta * 1e6 / AVG_MONTH_SECONDS
            else:
                per_second = 0.0
            entry.update({
                "basePeriod": base_period,
                "baseValueM": base_val,   # millones de EUR
                "prevPeriod": prev_period,
                "prevValueM": prev_val,
                "avgDeltaM": round(avg_delta, 1),
                "perSecond": round(per_second, 3),
            })
        monetary[name] = entry

    m3_last_period = monetary["m3"]["basePeriod"]
    m3_last_date = datetime.strptime(m3_last_period, "%Y-%m").replace(tzinfo=timezone.utc)
    days_late = (datetime.now(timezone.utc) - m3_last_date).days
    if days_late > 130:
        warn(f"M3 lleva {days_late} dias sin actualizarse (ultima obs {m3_last_period})")

    # ── HICP encadenado ──
    categories = []
    for code, name_es, name_en in HICP_CATEGORIES:
        old_inx = read_series(conn, f"icp_old:{code}:INX")
        new_inx = read_series(conn, f"icp_new:{code}:INX")
        old_anr = read_series(conn, f"icp_old:{code}:ANR")
        new_anr = read_series(conn, f"icp_new:{code}:ANR")
        if not old_inx:
            raise RuntimeError(f"HICP legacy {code} vacio; ejecuta con --full")
        idx = chain_index(old_inx, new_inx)
        anr = dict(old_anr)
        anr.update({p: v for p, v in new_anr.items() if p > OLD_BREAK})

        idx_hist = [[p, round(v, 2)] for p, v in sorted_items(idx)]
        anr_hist = [[p, v] for p, v in sorted_items(anr)]
        categories.append({
            "code": code,
            "es": name_es,
            "en": name_en,
            "index": idx_hist,
            "anr": anr_hist,
        })

    anr_all = categories[0]["anr"]
    latest_anr = anr_all[-1] if anr_all else None
    if latest_anr and not (0 <= latest_anr[1] <= 20):
        warn(f"HICP ANR fuera de rango plausible: {latest_anr}")

    payload = {
        "meta": {
            "generatedAt": now_iso,
            "lastOfficial": {
                "monetary": m3_last_period,
                "hicp": latest_anr[0] if latest_anr else None,
            },
            "avgMonthSeconds": AVG_MONTH_SECONDS,
            "unit": "millions EUR (monetary), chained index (HICP)",
            "hicpBases": "2015=100 hasta 2025-12; encadenado con 2025=100 desde 2026-01",
            "sources": {
                "portal": "https://data.ecb.europa.eu/",
                "api": "https://data-api.ecb.europa.eu/",
                "license": "CC BY 4.0 (European Central Bank)",
            },
            "sliderYears": SLIDER_YEARS,
        },
        "monetary": monetary,
        "hicp": {"categories": categories},
        "items": EMBLEMATIC_ITEMS,
    }
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="ETL ECB Money Printer")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--full", action="store_true", help="recarga el historico completo")
    args = parser.parse_args()

    started = time.time()
    conn = open_db(args.db)
    try:
        download(conn, args.full)
        payload = build_payload(conn)
    finally:
        conn.close()

    args.out.parent.mkdir(parents=True, exist_ok=True)
    tmp = args.out.with_suffix(".tmp")
    tmp.write_text(json.dumps(payload, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    tmp.replace(args.out)

    size_kb = args.out.stat().st_size / 1024
    log(f"OK: {args.out} ({size_kb:.1f} KB) en {time.time() - started:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
