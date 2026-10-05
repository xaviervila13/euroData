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

INFLATION_SOURCES = [
    {"label": "Eurostat · PIB real per cápita (sdg_08_10)",
     "url": "https://ec.europa.eu/eurostat/databrowser/view/sdg_08_10/default/table"},
    {"label": "BCE · masa monetaria M3 (BSI)",
     "url": "https://data.ecb.europa.eu/data/datasets/BSI"},
    {"label": "HICP · inflación de la eurozona (BCE/Eurostat)",
     "url": "https://data.ecb.europa.eu/data/datasets/ICP"},
    {"label": "World Gold Council · LBMA Gold Price (EUR)",
     "url": "https://www.gold.org/goldhub/data/gold-prices"},
]
INFLATION_START_YEAR = "2005"
BASKET_START = "1999-01"

# Parametros del simulador de cuenta individual (pensiones)
SIM_CONTRIBUTION_RATE = 0.37   # tipo total de cotizacion (Orden anual de cotizacion)
SIM_YEARS = 40
SIM_RETURNS = [0.02, 0.04, 0.06]   # retornos reales anuales (escenarios, no promesa)
SIM_WITHDRAWAL = 0.04              # retirada anual sostenible asumida

PENSIONS_SOURCES = [
    {"label": "Eurostat · Gasto en pensiones por tipo (spr_exp_pens)",
     "url": "https://ec.europa.eu/eurostat/databrowser/view/spr_exp_pens/default/table"},
    {"label": "Eurostat · Gasto público por función (gov_10a_exp)",
     "url": "https://ec.europa.eu/eurostat/databrowser/view/gov_10a_exp/default/table"},
    {"label": "Eurostat · Indicadores demográficos (demo_pjanind)",
     "url": "https://ec.europa.eu/eurostat/databrowser/view/demo_pjanind/default/table"},
    {"label": "Eurostat · Proyecciones de población 2023 (proj_23np)",
     "url": "https://ec.europa.eu/eurostat/databrowser/view/proj_23np/default/table"},
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


def _inflation_section(store: dict, monetary: dict, hicp: dict) -> dict:
    gdp_es = _sorted(store.get("eu:gdp_pc_es") or {})
    gold_eur = store.get("gold:lbma_eur") or {}
    if not gdp_es:
        raise RuntimeError("serie de PIB real per cápita vacía")
    if not gold_eur:
        raise RuntimeError("serie del precio del oro vacía")

    es_series = _trim(gdp_es, INFLATION_START_YEAR)
    es_last_y, es_last_v = es_series[-1]
    es_first = next((v for y, v in es_series if y == INFLATION_START_YEAR), es_series[0][1])

    # ── El carrito de la compra: en euros y en onzas de oro (1999=100) ──
    hicp_monthly = dict(hicp["categories"][0]["index"])
    months = [m for m in sorted(hicp_monthly) if m >= BASKET_START and m in gold_eur]
    if len(months) < 12:
        raise RuntimeError("sin meses comunes entre HICP y oro para el carrito")
    base = months[0]
    h0, g0 = hicp_monthly[base], gold_eur[base]
    basket_eur = [[m, round(hicp_monthly[m] / h0 * 100, 1)] for m in months]
    basket_gold = [[m, round(hicp_monthly[m] / h0 * 100 * g0 / gold_eur[m], 1)] for m in months]
    last_month = months[-1]
    eur_now = dict(basket_eur)[last_month]
    gold_now = dict(basket_gold)[last_month]

    metrics = [
        {"id": "gdp_pc_es", "value": round(es_last_v), "period": es_last_y,
         "extra": _pct(es_last_v, es_first), "extraRef": INFLATION_START_YEAR,
         "source": "Eurostat"},
        {"id": "basket_eur", "value": eur_now, "period": last_month,
         "extra": round(eur_now - 100, 0), "extraRef": base,
         "source": "HICP · BCE/Eurostat"},
        {"id": "basket_gold", "value": round(gold_now - 100, 0), "period": last_month,
         "extra": round(g0, 0), "extraRef": base,
         "source": "HICP + LBMA"},
    ]

    charts = [
        {"id": "basket_gold", "type": "line", "unit": "index",
         "series": basket_eur, "series2": basket_gold},
    ]

    return {"inflation": {"metrics": metrics, "charts": charts, "sources": INFLATION_SOURCES}}


def _pension_references(store: dict, meta: dict) -> list:
    """Rentabilidad real historica: deuda publica espanola (calculada) y referencias academicas."""
    bond = store.get("eu:bond10y_es") or {}
    hicp_m = store.get("eu:hicp_es_m") or {}
    ref = (meta or {}).get("ref:real_returns") or {}

    by_year: dict = {}
    for period, value in hicp_m.items():
        by_year.setdefault(period[:4], []).append(value)
    hicp_y = {y: sum(v) / len(v) for y, v in by_year.items()}

    def real_bond(a: str, z: str):
        years = [y for y in sorted(bond) if a <= y <= z and y in hicp_y]
        if len(years) < 5:
            return None, None
        nominal = sum(bond[y] for y in years) / len(years)
        inflation = sum(hicp_y[y] for y in years) / len(years)
        real = ((1 + nominal / 100) / (1 + inflation / 100) - 1) * 100
        return round(real, 2), f"{years[0]}-{years[-1]}"

    last = max(bond) if bond else None
    items = []
    if last:
        value, period = real_bond("1999", last)
        if value is not None:
            items.append({"key": "bond_es_long", "value": value, "period": period,
                          "source": "Eurostat (calculado)"})
        recent_start = str(int(last) - 9)
        value, period = real_bond(recent_start, last)
        if value is not None:
            items.append({"key": "bond_es_recent", "value": value, "period": period,
                          "source": "Eurostat (calculado)"})
    if ref:
        items.append({"key": "bond_us_long", "value": ref["bonds"]["1945-2025"],
                      "period": "1945-2025", "source": "Damodaran (académico)"})
        items.append({"key": "stocks_us_long", "value": ref["stocks"]["1945-2025"],
                      "period": "1945-2025", "source": "Damodaran (académico)"})
    return items


def _pensions_simulator(store: dict, meta: dict, salary: tuple, repl: float, life: float) -> dict:
    """Simulacion de una cuenta individual capitalizada frente al sistema publico."""
    salary_y, salary_v = salary
    contribution = salary_v * SIM_CONTRIBUTION_RATE

    def capital(n: int, rate: float) -> float:
        if rate == 0:
            return contribution * n
        return contribution * (((1 + rate) ** n - 1) / rate)

    capitals = {r: [[n, round(capital(n, r))] for n in range(SIM_YEARS + 1)] for r in SIM_RETURNS}
    cap_at = {r: round(capital(SIM_YEARS, r)) for r in SIM_RETURNS}
    public_pension = repl * salary_v
    total_system = public_pension * life

    metrics = [
        {"id": "sim_capital_low", "value": cap_at[0.02], "period": f"{SIM_YEARS} años", "source": "Escenario 2% real"},
        {"id": "sim_capital_mid", "value": cap_at[0.04], "period": f"{SIM_YEARS} años", "source": "Escenario 4% real"},
        {"id": "sim_capital_high", "value": cap_at[0.06], "period": f"{SIM_YEARS} años", "source": "Escenario 6% real"},
        {"id": "sim_income_mid", "value": round(cap_at[0.04] * SIM_WITHDRAWAL), "period": None, "source": "Retirada 4% anual"},
        {"id": "sim_pension", "value": round(public_pension), "period": None, "source": "Eurostat + INE"},
        {"id": "sim_system_total", "value": round(total_system), "period": None, "source": "Eurostat + INE"},
    ]

    assumptions = [
        {"key": "salary", "value": round(salary_v), "period": salary_y},
        {"key": "rate", "value": round(SIM_CONTRIBUTION_RATE * 100, 1)},
        {"key": "contribution", "value": round(contribution)},
        {"key": "replacement", "value": round(repl * 100)},
        {"key": "life", "value": round(life, 1)},
        {"key": "returns", "value": [round(r * 100) for r in SIM_RETURNS]},
        {"key": "withdrawal", "value": round(SIM_WITHDRAWAL * 100)},
    ]

    charts = [
        {"id": "pension_sim", "type": "line", "unit": "euro",
         "series": capitals[0.04], "series2": capitals[0.02], "series3": capitals[0.06],
         "reference": {"value": round(total_system)}},
    ]

    return {"simulator": {"metrics": metrics, "charts": charts, "assumptions": assumptions,
                          "references": _pension_references(store, meta)}}


def _pensions_section(store: dict, meta: dict | None = None) -> dict:
    spend = _sorted(store.get("eu:pension_spend_es") or {})
    dep = _sorted(store.get("eu:old_dep_es") or {})
    proj_old = store.get("eu:proj_old_es") or {}
    proj_act = store.get("eu:proj_active_es") or {}
    edu = _sorted(store.get("eu:edu_spend_es") or {})
    social = _sorted(store.get("eu:social_spend_es") or {})
    if not spend or not dep or not proj_old or not proj_act:
        raise RuntimeError("faltan series de pensiones")

    # Ratio de dependencia: historico observado + proyeccion (hasta 2050)
    dep_hist = [[y, round(v, 1)] for y, v in _trim(dep, "1975")]
    proj_years = [y for y in sorted(proj_old) if "2025" <= y <= "2050" and y in proj_act]
    dep_proj_full = [[y, round(100 * proj_old[y] / proj_act[y], 1)] for y in proj_years]
    dep_chain = [[dep_hist[-1][0], dep_hist[-1][1]]] + dep_proj_full if dep_hist and dep_proj_full else dep_proj_full

    # Gasto observado + ESTIMACION por elasticidad (2011-2024) aplicada a la demografia
    spend_series = [[y, round(v, 2)] for y, v in _trim(spend, "1995")]
    spend_by = dict(spend)
    dep_by = dict(dep)
    elasticity = None
    if "2011" in spend_by and "2024" in spend_by and "2011" in dep_by and "2025" in dep_by:
        elasticity = (spend_by["2024"] - spend_by["2011"]) / (dep_by["2025"] - dep_by["2011"])
    spend_est = []
    if elasticity:
        base_spend, base_dep = spend_series[-1][1], dep_by.get("2025")
        spend_est = [[y, round(base_spend + elasticity * (v - base_dep), 1)]
                     for y, v in dep_proj_full if y > spend_series[-1][0]]
        spend_est = [[spend_series[-1][0], spend_series[-1][1]]] + spend_est

    # Comparacion con educacion (COFOG, % del PIB)
    edu_series = [[y, round(v, 2)] for y, v in _trim(edu, "1995")] if edu else []
    social_series = [[y, round(v, 2)] for y, v in _trim(social, "1995")] if social else []

    spend_last_y, spend_last_v = spend_series[-1]
    dep_now = dep_hist[-1][1]
    dep_2050 = dep_proj_full[-1][1] if dep_proj_full else None
    spend_2050 = spend_est[-1][1] if spend_est else None
    edu_last = edu_series[-1] if edu_series else [None, None]

    metrics = [
        {"id": "pension_spend", "value": spend_last_v, "period": spend_last_y,
         "extra": round(spend_last_v - spend_series[0][1], 2), "extraRef": spend_series[0][0],
         "source": "Eurostat"},
        {"id": "pension_spend_2050", "value": spend_2050, "period": "2050",
         "source": "Estimación propia"},
        {"id": "edu_spend", "value": edu_last[1], "period": edu_last[0],
         "source": "Eurostat"},
        {"id": "old_dep", "value": dep_now, "period": dep_hist[-1][0],
         "source": "Eurostat"},
        {"id": "old_dep_2050", "value": dep_2050, "period": "2050",
         "source": "Eurostat (proy.)"},
        {"id": "pensioners_2050", "value": round(proj_old.get("2050", 0) / 1e6, 1), "period": "2050",
         "extra": round(proj_act.get("2050", 0) / 1e6, 1), "extraRef": "2050",
         "source": "Eurostat (proy.)"},
    ]

    charts = [
        {"id": "old_dep", "type": "line", "unit": "ratio",
         "series": dep_hist, "series2": dep_chain, "projectionFrom": dep_hist[-1][0] if dep_hist else None},
        {"id": "pension_spend", "type": "line", "unit": "pct_gdp",
         "series": spend_series, "series2": spend_est,
         "projectionFrom": spend_series[-1][0] if spend_est else None,
         "estimate": True},
        {"id": "spend_compare", "type": "line", "unit": "pct_gdp",
         "series": social_series, "series2": edu_series},
    ]

    # Simulador: necesita salario (INE), tasa de reemplazo y esperanza de vida (Eurostat)
    salary_series = _sorted(store.get("ine:salary_es") or {})
    repl_series = _sorted(store.get("eu:replacement_es") or {})
    life_series = _sorted(store.get("eu:life_exp65_es") or {})
    simulator = {}
    if salary_series and repl_series and life_series:
        simulator = _pensions_simulator(store, meta, salary_series[-1], repl_series[-1][1], life_series[-1][1])
    else:
        log.warning("faltan series para el simulador de pensiones")

    return {"pensions": {"metrics": metrics, "charts": charts,
                         "sources": PENSIONS_SOURCES, **simulator}}


def build_payload(store: dict, meta: dict | None = None, generated_at: str | None = None) -> dict:
    """Construye el payload JSON completo."""
    now_iso = generated_at or datetime.now(timezone.utc).isoformat(timespec="seconds")
    monetary = _monetary_section(store)
    hicp = _hicp_section(store)
    problems = {**_housing_section(store), **_inflation_section(store, monetary, hicp),
                **_pensions_section(store, meta)}

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
                "realGdp": problems["inflation"]["metrics"][0]["period"],
                "pensions": problems["pensions"]["metrics"][0]["period"],
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
