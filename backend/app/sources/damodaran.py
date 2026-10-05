"""Rentabilidad real a largo plazo de acciones y bonos (dataset academico).

Fuente: Aswath Damodaran (NYU Stern), "Historical Returns on Stocks, Bonds and
Bills in the US" -> https://pages.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls

Es un dataset publico ACADEMICO (mercado de EE.UU.), no estadistica oficial.
Se calcula la media geometrica de las rentabilidades reales anuales (descontada
la inflacion) por ventana temporal.

Las columnas se localizan POR NOMBRE, no por posicion, y el resultado se valida
en un rango plausible: si el formato del fichero cambia, la fuente falla sola.
"""

from __future__ import annotations

import io
import logging
import time
import urllib.error
import urllib.request

import xlrd

log = logging.getLogger("esproblemas.damodaran")

URL = "https://pages.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls"
USER_AGENT = "es-problemas/1.0 (data tracker)"
SHEET = "Returns by year"
WINDOWS = [1928, 1945, 2000]

# Rangos plausibles para validar el parseo (rentabilidad real anual, %)
LIMITS = {"stocks": (3.0, 12.0), "bonds": (-2.0, 6.0)}


def _download(retries: int = 3) -> bytes:
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            req = urllib.request.Request(URL, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=90) as resp:
                return resp.read()
        except (urllib.error.URLError, urllib.error.HTTPError, OSError) as err:
            last_err = err
            wait = 3 * attempt
            log.warning("intento %d/%d fallo descargando Damodaran: %s (reintento en %ds)",
                        attempt, retries, err, wait)
            time.sleep(wait)
    raise RuntimeError(f"No se pudo descargar el dataset de Damodaran: {last_err}")


def _find_columns(sheet) -> tuple[int, dict]:
    """Localiza la fila de cabecera y las columnas del bloque de rentabilidad real."""
    header_row = None
    for r in range(min(sheet.nrows, 40)):
        if str(sheet.cell_value(r, 0)).strip().lower() == "year":
            header_row = r
            break
    if header_row is None:
        raise RuntimeError("no se encontro la fila de cabecera 'Year'")

    labels = [str(sheet.cell_value(header_row, c)).strip() for c in range(sheet.ncols)]
    if "Inflation Rate" not in labels:
        raise RuntimeError("no se encontro la columna 'Inflation Rate'")

    # El bloque de rentabilidades reales empieza justo despues de la inflacion y
    # termina donde vuelve a aparecer la primera columna (bloque de indices), que
    # se reconoce normalizando los sufijos numericos que anade la hoja.
    def norm(label: str) -> str:
        return label.rstrip("0123456789 ").strip().lower()

    start = labels.index("Inflation Rate") + 1
    first_norm = norm(labels[start])
    end = start
    for c in range(start + 1, len(labels)):
        if norm(labels[c]) == first_norm:
            break
        end = c + 1

    block = range(start, end)
    stocks = next((c for c in block if labels[c].startswith("S&P 500")), None)
    bonds = next((c for c in block if "bond" in labels[c].lower()), None)
    if stocks is None or bonds is None:
        raise RuntimeError(f"no se encontraron columnas de acciones/bonos en el bloque {list(block)}")
    return header_row, {"stocks": stocks, "bonds": bonds}


def fetch_real_returns() -> dict:
    """Devuelve {'stocks': {ventana: cagr}, 'bonds': {...}, 'lastYear': n}."""
    book = xlrd.open_workbook(file_contents=_download())
    sheet = book.sheet_by_name(SHEET)
    header_row, cols = _find_columns(sheet)

    years, values = [], {"stocks": [], "bonds": []}
    for r in range(header_row + 1, sheet.nrows):
        try:
            year = int(sheet.cell_value(r, 0))
        except (TypeError, ValueError):
            continue
        row_ok = True
        row = {}
        for key, c in cols.items():
            v = sheet.cell_value(r, c)
            if not isinstance(v, float):
                row_ok = False
                break
            row[key] = v
        if not row_ok:
            continue
        years.append(year)
        for key in cols:
            values[key].append(row[key])

    out = {}
    for key, series in values.items():
        # la hoja puede venir en fracciones (0,09) o en porcentaje (9,0): se normaliza
        scale = 100.0 if sorted(abs(v) for v in series)[len(series) // 2] > 1.5 else 1.0
        if scale != 1.0:
            log.info("%s: valores en porcentaje, se dividen por 100", key)
        series = [v / scale for v in series]
        per_window = {}
        for start in WINDOWS:
            vals = [v for y, v in zip(years, series) if y >= start]
            if not vals:
                continue
            growth = 1.0
            for v in vals:
                growth *= (1 + v)
            cagr = (growth ** (1 / len(vals)) - 1) * 100
            lo, hi = LIMITS[key]
            if not (lo <= cagr <= hi):
                raise RuntimeError(f"{key} {start}: CAGR {cagr:.2f}% fuera del rango plausible ({lo}-{hi}%)")
            per_window[f"{start}-{years[-1]}"] = round(cagr, 2)
        out[key] = per_window

    out["lastYear"] = years[-1]
    out["source"] = "A. Damodaran (NYU Stern), Historical Returns on Stocks, Bonds and Bills"
    return out


def download_all() -> dict:
    """Devuelve el valor de metadatos (no es una serie temporal)."""
    data = fetch_real_returns()
    log.info("damodaran: acciones %s | bonos %s (hasta %s)",
             data["stocks"], data["bonds"], data["lastYear"])
    return data
