"""Descarga y transformacion de datos del ECB Data Portal.

Modulo puro (solo stdlib): no toca base de datos. Devuelve un "store"
con la forma {series_id: {periodo: valor}} y construye el payload JSON
que consume el frontend.
"""

from __future__ import annotations

import csv
import io
import logging
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

log = logging.getLogger("europrinter.ecb")

API_BASE = "https://data-api.ecb.europa.eu/service/data"
USER_AGENT = "euro-printer/2.0 (data tracker)"
AVG_MONTH_SECONDS = 2_629_800  # 30.44 dias

BSI_SERIES = {
    "m1": ("BSI", "M.U2.Y.V.M10.X.1.U2.2300.Z01.E"),
    "m2": ("BSI", "M.U2.Y.V.M20.X.1.U2.2300.Z01.E"),
    "m3": ("BSI", "M.U2.Y.V.M30.X.1.U2.2300.Z01.E"),
}
BSI_START = "1980-01"

HICP_CATEGORIES = [
    ("000000", "Índice general", "All items"),
    ("011000", "Alimentación", "Food"),
    ("045000", "Electricidad y gas", "Electricity & gas"),
    ("041100", "Alquiler de vivienda", "Rents"),
    ("070000", "Transporte", "Transport"),
    ("111000", "Restaurantes y bares", "Restaurants & cafés"),
]
ICP_OLD_PREFIX = "ICP"
ICP_NEW_PREFIX = "HICP"
OLD_BREAK = "2025-12"
HICP_START_OLD = "1995-01"
HICP_START_NEW = "2024-01"

SLIDER_YEARS = [1996, 1999, 2002, 2008, 2015, 2020]

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


def fetch_series(flow: str, key: str, params: dict, retries: int = 3) -> dict:
    """Llama a la API SDMX del BCE y devuelve {periodo: valor}."""
    url = f"{API_BASE}/{flow}/{key}?{urllib.parse.urlencode(params)}"
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read().decode("utf-8")
            out = {}
            for row in csv.DictReader(io.StringIO(raw)):
                period, value = row.get("TIME_PERIOD"), row.get("OBS_VALUE")
                if period and value not in (None, "", "NaN"):
                    out[period] = float(value)
            return out
        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as err:
            last_err = err
            wait = 2 * attempt
            log.warning("intento %d/%d fallo para %s/%s: %s (reintento en %ds)",
                        attempt, retries, flow, key, err, wait)
            time.sleep(wait)
    raise RuntimeError(f"No se pudo descargar {flow}/{key}: {last_err}")


def download_all(full: bool) -> dict:
    """Descarga todas las series. full=True trae el historico completo."""
    store: dict = {}
    for name, (flow, key) in BSI_SERIES.items():
        params = {"format": "csvdata"}
        if full:
            params["startPeriod"] = BSI_START
        else:
            params["lastNObservations"] = 14
        data = fetch_series(flow, key, params)
        store[f"bsi:{name}"] = data
        log.info("bsi:%s: %d obs (ultima %s)", name, len(data), max(data) if data else "-")

    for code, _, _ in HICP_CATEGORIES:
        for suffix, start in (("INX", HICP_START_OLD), ("ANR", HICP_START_OLD)):
            params = {"format": "csvdata"}
            params["startPeriod" if full else "lastNObservations"] = start if full else 14
            store[f"icp_old:{code}:{suffix}"] = fetch_series(
                ICP_OLD_PREFIX, f"M.U2.N.{code}.4.{suffix}", params)
        for suffix, start in (("INX", HICP_START_NEW), ("ANR", HICP_START_NEW)):
            params = {"format": "csvdata"}
            params["startPeriod" if full else "lastNObservations"] = start if full else 14
            store[f"icp_new:{code}:{suffix}"] = fetch_series(
                ICP_NEW_PREFIX, f"M.U2.N.{code}.4D0.{suffix}", params)
    log.info("hicp: %d categorias x INX/ANR x legacy/nuevo", len(HICP_CATEGORIES))
    return store


def chain_index(old: dict, new: dict) -> dict:
    """Encadena el indice nuevo (2025=100) sobre el legacy (2015=100)
    usando el solapamiento en 2025-12 como ancla."""
    out = dict(old)
    anchor_new, anchor_old = new.get(OLD_BREAK), old.get(OLD_BREAK)
    if anchor_new and anchor_old and anchor_new > 0:
        factor = anchor_old / anchor_new
        out.update({p: v * factor for p, v in new.items() if p > OLD_BREAK})
    else:
        log.warning("no hay solapamiento para encadenar HICP; concatenando sin ajuste")
        out.update({p: v for p, v in new.items() if p > OLD_BREAK})
    return out


def _sorted_items(data: dict) -> list:
    return [(p, data[p]) for p in sorted(data)]


def build_payload(store: dict, generated_at: str | None = None) -> dict:
    """Construye el payload JSON del frontend a partir del store completo."""
    now_iso = generated_at or datetime.now(timezone.utc).isoformat(timespec="seconds")

    monetary = {}
    for name in BSI_SERIES:
        raw = store.get(f"bsi:{name}") or {}
        if not raw:
            raise RuntimeError(f"serie bsi:{name} vacia; falta bootstrap completo")
        hist = [[p, round(v, 1)] for p, v in _sorted_items(raw)]
        entry = {"history": hist}
        if name == "m3":
            base_period, base_val = hist[-1]
            prev_period, prev_val = hist[-2] if len(hist) > 1 else (None, None)
            deltas = [hist[i][1] - hist[i - 1][1] for i in range(max(1, len(hist) - 3), len(hist))]
            avg_delta = sum(deltas) / len(deltas)
            if prev_val and abs(base_val - prev_val) / prev_val > 0.025:
                log.warning("salto mensual de M3 inusual (>2.5%%); revisar revision de datos")
            entry.update({
                "basePeriod": base_period,
                "baseValueM": base_val,
                "prevPeriod": prev_period,
                "prevValueM": prev_val,
                "avgDeltaM": round(avg_delta, 1),
                "perSecond": round(avg_delta * 1e6 / AVG_MONTH_SECONDS, 3),
            })
        monetary[name] = entry

    categories = []
    for code, name_es, name_en in HICP_CATEGORIES:
        old_inx = store.get(f"icp_old:{code}:INX") or {}
        new_inx = store.get(f"icp_new:{code}:INX") or {}
        old_anr = store.get(f"icp_old:{code}:ANR") or {}
        new_anr = store.get(f"icp_new:{code}:ANR") or {}
        if not old_inx:
            raise RuntimeError(f"HICP legacy {code} vacio; falta bootstrap completo")
        idx = chain_index(old_inx, new_inx)
        anr = dict(old_anr)
        anr.update({p: v for p, v in new_anr.items() if p > OLD_BREAK})
        categories.append({
            "code": code,
            "es": name_es,
            "en": name_en,
            "index": [[p, round(v, 2)] for p, v in _sorted_items(idx)],
            "anr": [[p, v] for p, v in _sorted_items(anr)],
        })

    anr_all = categories[0]["anr"]
    latest_anr = anr_all[-1] if anr_all else None
    if latest_anr and not (0 <= latest_anr[1] <= 20):
        log.warning("HICP ANR fuera de rango plausible: %s", latest_anr)

    m3_last = monetary["m3"]["basePeriod"]
    m3_date = datetime.strptime(m3_last, "%Y-%m").replace(tzinfo=timezone.utc)
    days_late = (datetime.now(timezone.utc) - m3_date).days
    if days_late > 130:
        log.warning("M3 lleva %d dias sin actualizarse (ultima obs %s)", days_late, m3_last)

    return {
        "meta": {
            "generatedAt": now_iso,
            "lastOfficial": {
                "monetary": m3_last,
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
