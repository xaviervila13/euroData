"""Descarga de series del ECB Data Portal (SDMX 2.1, format=csvdata).

Modulo puro (solo stdlib): no toca base de datos.
"""

from __future__ import annotations

import csv
import io
import logging
import time
import urllib.error
import urllib.parse
import urllib.request

log = logging.getLogger("esproblemas.ecb")

API_BASE = "https://data-api.ecb.europa.eu/service/data"
USER_AGENT = "es-problemas/1.0 (data tracker)"

BSI_ITEMS = {"M10": "m1", "M20": "m2", "M30": "m3"}
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


def fetch_multi(flow: str, key: str, params: dict, retries: int = 4) -> dict:
    """Llama a la API SDMX del BCE y devuelve {clave_serie: {periodo: valor}}.

    La clave puede combinar valores con '+', de forma que una sola peticion
    devuelve varias series (menos carga para la API).
    """
    url = f"{API_BASE}/{flow}/{key}?{urllib.parse.urlencode(params)}"
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=90) as resp:
                raw = resp.read().decode("utf-8")
            out: dict = {}
            for row in csv.DictReader(io.StringIO(raw)):
                series_key = row.get("KEY") or key
                period, value = row.get("TIME_PERIOD"), row.get("OBS_VALUE")
                if period and value not in (None, "", "NaN"):
                    out.setdefault(series_key, {})[period] = float(value)
            if not out:
                raise RuntimeError(f"respuesta vacia para {flow}/{key}")
            return out
        except (urllib.error.URLError, urllib.error.HTTPError, OSError, RuntimeError) as err:
            last_err = err
            wait = 3 * attempt
            log.warning("intento %d/%d fallo para %s/%s: %s (reintento en %ds)",
                        attempt, retries, flow, key, err, wait)
            time.sleep(wait)
    raise RuntimeError(f"No se pudo descargar {flow}/{key}: {last_err}")


def download_all(full: bool) -> dict:
    """Descarga agregados monetarios y HICP. full=True trae el historico.

    Agrupa series por peticion (5 llamadas en total en vez de 27).
    """
    store: dict = {}

    # Agregados monetarios M1/M2/M3 en una sola peticion
    bsi_key = "M.U2.Y.V." + "+".join(BSI_ITEMS) + ".X.1.U2.2300.Z01.E"
    params = {"format": "csvdata"}
    params["startPeriod" if full else "lastNObservations"] = BSI_START if full else 14
    for series_key, obs in fetch_multi("BSI", bsi_key, params).items():
        item = next((p for p in series_key.split(".") if p in BSI_ITEMS), None)
        if not item:
            continue
        store[f"bsi:{BSI_ITEMS[item]}"] = obs
        log.info("bsi:%s: %d obs (ultima %s)", BSI_ITEMS[item], len(obs), max(obs))

    # HICP: una peticion por dataset y sufijo (INX / ANR)
    codes = "+".join(code for code, _, _ in HICP_CATEGORIES)
    for flow, mid, id_prefix, start in (
        (ICP_OLD_PREFIX, "4", "icp_old", HICP_START_OLD),
        (ICP_NEW_PREFIX, "4D0", "icp_new", HICP_START_NEW),
    ):
        for suffix in ("INX", "ANR"):
            params = {"format": "csvdata"}
            params["startPeriod" if full else "lastNObservations"] = start if full else 14
            key = f"M.U2.N.{codes}.{mid}.{suffix}"
            data = fetch_multi(flow, key, params)
            for series_key, obs in data.items():
                code = series_key.split(".")[4]
                store[f"{id_prefix}:{code}:{suffix}"] = obs
            log.info("%s:%s: %d series", id_prefix, suffix, len(data))
    return store


def chain_index(old: dict, new: dict) -> dict:
    """Encadena el indice nuevo (2025=100) sobre el legacy (2015=100)
    usando el solapamiento con OLD_BREAK como ancla."""
    out = dict(old)
    anchor_new, anchor_old = new.get(OLD_BREAK), old.get(OLD_BREAK)
    if anchor_new and anchor_old and anchor_new > 0:
        factor = anchor_old / anchor_new
        out.update({p: v * factor for p, v in new.items() if p > OLD_BREAK})
    else:
        log.warning("no hay solapamiento para encadenar HICP; concatenando sin ajuste")
        out.update({p: v for p, v in new.items() if p > OLD_BREAK})
    return out
