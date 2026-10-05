"""Precio del oro (fixing LBMA) desde el World Gold Council.

Endpoint publico sin clave: https://fsapi.gold.org/api/goldprice/v13/chart/main?period=max
Devuelve series diarias por divisa; usamos el fixing de la manana en euros
(lbma_am_eur) agregado a media mensual.

Fuente: World Gold Council · LBMA Gold Price (industria del oro, no institucion
publica; es el fixing de referencia mundial del metal).
"""

from __future__ import annotations

import collections
import json
import logging
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

log = logging.getLogger("esproblemas.gold")

API_URL = "https://fsapi.gold.org/api/goldprice/v13/chart/main"
USER_AGENT = "es-problemas/1.0 (data tracker)"
SERIES_KEY = "lbma_am_eur"


def fetch_monthly(period: str = "max", retries: int = 3) -> dict:
    """Descarga el fixing LBMA en EUR y devuelve {AAAA-MM: media mensual}."""
    url = f"{API_URL}?period={period}"
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=90) as resp:
                doc = json.loads(resp.read().decode("utf-8"))
            series = doc.get("chartData", {}).get(SERIES_KEY)
            if not series:
                raise RuntimeError(f"respuesta sin la serie {SERIES_KEY}")
            buckets: dict[str, list[float]] = collections.OrderedDict()
            for ts, price in series:
                month = datetime.fromtimestamp(ts / 1000, timezone.utc).strftime("%Y-%m")
                buckets.setdefault(month, []).append(float(price))
            out = {m: round(sum(v) / len(v), 2) for m, v in sorted(buckets.items())}
            if not out:
                raise RuntimeError("serie de oro vacia")
            return out
        except (urllib.error.URLError, urllib.error.HTTPError, OSError, ValueError, RuntimeError) as err:
            last_err = err
            wait = 3 * attempt
            log.warning("intento %d/%d fallo en el oro: %s (reintento en %ds)", attempt, retries, err, wait)
            time.sleep(wait)
    raise RuntimeError(f"No se pudo descargar el precio del oro: {last_err}")


def download_all() -> dict:
    data = fetch_monthly()
    log.info("gold: %d meses (ultimo %s, %.2f EUR/oz)", len(data), max(data), data[max(data)])
    return {"gold:lbma_eur": data}
