"""Construccion del payload JSON que consume el frontend.

Secciones: monetary (M1/M2/M3 + contador), hicp (inflacion) y problems
(vivienda y futuros problemas).
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from .sources.ecb import BSI_ITEMS, HICP_CATEGORIES, OLD_BREAK, chain_index

log = logging.getLogger("esproblemas.payload")

MONETARY_NAMES = list(BSI_ITEMS.values())

AVG_MONTH_SECONDS = 2_629_800  # 30.44 dias

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

HOUSING_SOURCES = [
    {"label": "Eurostat · House price index (prc_hpi_q)",
     "url": "https://ec.europa.eu/eurostat/databrowser/view/prc_hpi_q/default/table"},
    {"label": "Eurostat · Building permits (sts_cobp_a)",
     "url": "https://ec.europa.eu/eurostat/databrowser/view/sts_cobp_a/default/table"},
    {"label": "Eurostat · Immigration by citizenship (tps00176)",
     "url": "https://ec.europa.eu/eurostat/databrowser/view/tps00176/default/table"},
    {"label": "INE · Encuesta de Características Esenciales de la Población y las Viviendas (60132, 60133)",
     "url": "https://www.ine.es/jaxiT3/Tabla.htm?t=60133"},
]


def _sorted(data: dict) -> list:
    return [(p, data[p]) for p in sorted(data)]


def _pct(new: float, old: float) -> float:
    return round((new / old - 1) * 100, 1) if old else 0.0


HOUSING_START_YEAR = "2005"


def _trim(series: list, start_year: str = HOUSING_START_YEAR) -> list:
    """Recorta al horizonte temporal comun de la seccion (2005-)."""
    return [row for row in series if year_of(row[0]) >= start_year] or series[-1:]


def year_of(period: str) -> str:
    return period[:4]


def _monetary_section(store: dict) -> dict:
    monetary = {}
    for name in MONETARY_NAMES:
        raw = store.get(f"bsi:{name}") or {}
        if not raw:
            raise RuntimeError(f"serie bsi:{name} vacia; falta bootstrap completo")
        hist = [[p, round(v, 1)] for p, v in _sorted(raw)]
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
    return monetary


def _hicp_section(store: dict) -> dict:
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
            "index": [[p, round(v, 2)] for p, v in _sorted(idx)],
            "anr": [[p, v] for p, v in _sorted(anr)],
        })
    return {"categories": categories}


def _housing_section(store: dict) -> dict:
    hpi = _sorted(store.get("eu:hpi_es") or {})
    permits = _sorted(store.get("eu:permits_es") or {})
    immigration = _sorted(store.get("eu:immigration_es") or {})
    population = _sorted(store.get("eu:population_es") or {})
    households = _sorted(store.get("ine:hogares_es") or {})
    size = _sorted(store.get("ine:tamano_hogar_es") or {})
    # Horizonte temporal comun para toda la seccion
    hpi, permits, immigration, population = (_trim(hpi), _trim(permits),
                                             _trim(immigration), _trim(population))
    for name, data in (("hpi", hpi), ("permits", permits), ("population", population),
                       ("households", households)):
        if not data:
            raise RuntimeError(f"serie de vivienda '{name}' vacia")

    # Precios: nivel actual, pico previo a la crisis e interanual
    hpi_last_p, hpi_last_v = hpi[-1]
    pre_crisis = [r for r in hpi if year_of(r[0]) <= "2007"] or hpi[:1]
    peak_p, peak_v = max(pre_crisis, key=lambda r: r[1])
    yoy_p = f"{int(year_of(hpi_last_p)) - 1}-{hpi_last_p.split('-')[1]}"
    yoy_prev = next((v for p, v in hpi if p == yoy_p), None)
    yoy = _pct(hpi_last_v, yoy_prev) if yoy_prev else None

    # Oferta: visados (miles de viviendas)
    permits_last_y, permits_last_v = permits[-1]
    permits_peak_y, permits_peak_v = max(permits, key=lambda r: r[1])

    # Demanda: hogares (trimestral), poblacion e inmigracion
    hog_last_p, hog_last_v = households[-1]
    hog_first_p, hog_first_v = households[0]
    hog_delta = (hog_last_v - hog_first_v) / 1e6
    size_last = size[-1] if size else (None, None)
    imm_last = immigration[-1] if immigration else (None, None)
    pop_last_y, pop_last_v = population[-1]
    pop_start = next((v for y, v in population if y == HOUSING_START_YEAR), None)

    metrics = [
        {"id": "hpi", "value": round(hpi_last_v, 1), "period": hpi_last_p,
         "extra": _pct(hpi_last_v, peak_v), "extraRef": peak_p, "source": "Eurostat"},
        {"id": "hpi_yoy", "value": round(yoy, 1) if yoy is not None else None,
         "period": hpi_last_p, "source": "Eurostat"},
        {"id": "visados", "value": round(permits_last_v, 1), "period": permits_last_y,
         "extra": _pct(permits_last_v, permits_peak_v), "extraRef": permits_peak_y,
         "source": "Eurostat"},
        {"id": "hogares", "value": round(hog_last_v), "period": hog_last_p,
         "extra": round(hog_delta, 2), "extraRef": hog_first_p, "source": "INE"},
        {"id": "tamano_hogar", "value": round(size_last[1], 2) if size_last[1] else None,
         "period": size_last[0], "source": "INE"},
        {"id": "inmigracion", "value": round(imm_last[1]) if imm_last[1] else None,
         "period": imm_last[0], "source": "Eurostat"},
        {"id": "poblacion", "value": round(pop_last_v), "period": pop_last_y,
         "extra": round((pop_last_v - pop_start) / 1e6, 2) if pop_start else None,
         "extraRef": HOUSING_START_YEAR, "source": "Eurostat"},
    ]

    charts = [
        {"id": "hpi", "type": "line", "unit": "index",
         "series": [[p, round(v, 1)] for p, v in hpi],
         "peak": {"period": peak_p, "value": round(peak_v, 1)},
         "band": {"from": "2008-Q1", "to": "2013-Q4"}},
        {"id": "permits", "type": "bars", "unit": "thousand",
         "series": [[p, round(v, 1)] for p, v in permits],
         "peak": {"period": permits_peak_y, "value": round(permits_peak_v, 1)}},
        {"id": "population", "type": "line", "unit": "people",
         "series": [[p, round(v)] for p, v in population]},
        {"id": "hogares", "type": "line", "unit": "people",
         "series": [[p, round(v)] for p, v in households]},
        {"id": "inmigracion", "type": "bars", "unit": "people",
         "series": [[p, round(v)] for p, v in immigration]},
    ]

    return {
        "housing": {
            "metrics": metrics,
            "charts": charts,
            "sources": HOUSING_SOURCES,
        }
    }


def build_payload(store: dict, generated_at: str | None = None) -> dict:
    """Construye el payload JSON completo."""
    now_iso = generated_at or datetime.now(timezone.utc).isoformat(timespec="seconds")
    monetary = _monetary_section(store)
    hicp = _hicp_section(store)
    problems = _housing_section(store)

    m3_last = monetary["m3"]["basePeriod"]
    m3_date = datetime.strptime(m3_last, "%Y-%m").replace(tzinfo=timezone.utc)
    days_late = (datetime.now(timezone.utc) - m3_date).days
    if days_late > 130:
        log.warning("M3 lleva %d dias sin actualizarse (ultima obs %s)", days_late, m3_last)

    anr_all = hicp["categories"][0]["anr"]
    latest_anr = anr_all[-1] if anr_all else None
    if latest_anr and not (0 <= latest_anr[1] <= 20):
        log.warning("HICP ANR fuera de rango plausible: %s", latest_anr)

    return {
        "meta": {
            "generatedAt": now_iso,
            "lastOfficial": {
                "monetary": m3_last,
                "hicp": latest_anr[0] if latest_anr else None,
                "housing": problems["housing"]["metrics"][0]["period"],
            },
            "avgMonthSeconds": AVG_MONTH_SECONDS,
            "hicpBases": "2015=100 hasta 2025-12; encadenado con 2025=100 desde 2026-01",
            "sources": {
                "ecb": "https://data.ecb.europa.eu/",
                "eurostat": "https://ec.europa.eu/eurostat/",
                "ine": "https://www.ine.es/",
                "licenses": "CC BY 4.0 / reutilizacion con atribucion",
            },
            "sliderYears": SLIDER_YEARS,
        },
        "monetary": monetary,
        "hicp": hicp,
        "problems": problems,
        "items": EMBLEMATIC_ITEMS,
    }
