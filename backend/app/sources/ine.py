"""Cliente del API JSON del INE (Tempus3 / INEbase).

API: https://servicios.ine.es/wstempus/jsCache/ES/DATOS_TABLA/{tabla}
Sin clave. El JSON puede venir en latin-1 segun la tabla, se decodifica tolerante.
"""

from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.request

log = logging.getLogger("esproblemas.ine")

API_BASE = "https://servicios.ine.es/wstempus/jsCache/ES/DATOS_TABLA"
USER_AGENT = "es-problemas/1.0 (data tracker)"


def fetch_table(table_id: str | int, retries: int = 3) -> list:
    """Descarga todas las series de una tabla de INEbase."""
    url = f"{API_BASE}/{table_id}"
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=60) as resp:
                raw = resp.read().decode("utf-8", errors="replace")
            data = json.loads(raw)
            if not isinstance(data, list):
                raise RuntimeError(f"tabla {table_id}: respuesta inesperada")
            return data
        except (urllib.error.URLError, urllib.error.HTTPError, OSError, ValueError) as err:
            last_err = err
            wait = 2 * attempt
            log.warning("intento %d/%d fallo para tabla %s: %s (reintento en %ds)",
                        attempt, retries, table_id, err, wait)
            time.sleep(wait)
    raise RuntimeError(f"No se pudo descargar la tabla {table_id}: {last_err}")


def pick_series(table: list, name_prefix: str) -> dict:
    """Devuelve la primera serie cuyo nombre empieza por name_prefix."""
    for series in table:
        if str(series.get("Nombre", "")).startswith(name_prefix):
            return series
    raise RuntimeError(f"no se encontro serie '{name_prefix}'")


INE_QUARTERS = {19: "Q1", 20: "Q2", 21: "Q3", 22: "Q4"}


def series_values(series: dict) -> dict:
    """Convierte una serie del INE en {periodo: valor}.

    Periodos: 'YYYY' (anual), 'YYYY-Qn' (trimestral, FK_Periodo 19-22)
    o 'YYYY-MM' si solo hay NombrePeriodo.
    """
    out = {}
    for point in series.get("Data", []):
        if point.get("Secreto"):
            continue
        value = point.get("Valor")
        if value is None:
            continue
        year = point.get("Anyo")
        quarter = INE_QUARTERS.get(point.get("FK_Periodo"))
        if year and quarter:
            period = f"{year}-{quarter}"
        elif year:
            period = str(year)
        elif point.get("NombrePeriodo"):
            period = str(point["NombrePeriodo"])
        elif point.get("Fecha"):
            period = time.strftime("%Y-%m", time.gmtime(point["Fecha"] / 1000))
        else:
            continue
        out[period] = float(value)
    return out
