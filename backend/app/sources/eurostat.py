"""Cliente del API de difusion de Eurostat (JSON-stat 2.0).

API: https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{dataset}
Sin clave. Devuelve {periodo: valor} para un corte concreto (query params).
"""

from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.parse
import urllib.request

log = logging.getLogger("esproblemas.eurostat")

API_BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"
USER_AGENT = "es-problemas/1.0 (data tracker)"


def fetch_dataset(dataset: str, params: dict, retries: int = 3) -> dict:
    """Descarga un corte de un dataset de Eurostat y devuelve {periodo: valor}."""
    params = dict(params)
    params["format"] = "JSON"
    url = f"{API_BASE}/{dataset}?{urllib.parse.urlencode(params)}"
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as resp:
                doc = json.loads(resp.read().decode("utf-8"))
            return _decode_jsonstat(doc, dataset)
        except (urllib.error.URLError, urllib.error.HTTPError, OSError, ValueError) as err:
            last_err = err
            wait = 2 * attempt
            log.warning("intento %d/%d fallo para %s: %s (reintento en %ds)",
                        attempt, retries, dataset, err, wait)
            time.sleep(wait)
    raise RuntimeError(f"No se pudo descargar Eurostat {dataset}: {last_err}")


def _decode_jsonstat(doc: dict, dataset: str) -> dict:
    if "error" in doc:
        raise RuntimeError(f"Eurostat {dataset}: {doc['error']}")

    ids = doc["id"]
    size = doc["size"]
    dims = doc["dimension"]

    ord_to_label: dict[str, dict[int, str]] = {}
    for dim in ids:
        index = dims.get(dim, {}).get("category", {}).get("index", {})
        mapping = {}
        for key, value in index.items():
            if isinstance(value, int):
                mapping[value] = key
            else:
                mapping[int(key)] = value
        ord_to_label[dim] = mapping

    time_dim = ids.index("time")
    out = {}
    for key, value in doc.get("value", {}).items():
        remainder = int(key)
        coords = []
        for dimension_size in reversed(size):
            coords.append(remainder % dimension_size)
            remainder //= dimension_size
        coords.reverse()
        period = ord_to_label["time"][coords[time_dim]]
        out[period] = float(value)
    if not out:
        raise RuntimeError(f"Eurostat {dataset}: respuesta sin valores")
    return out
