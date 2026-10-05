"""Series oficiales del problema de las pensiones (Eurostat)."""

from __future__ import annotations

import logging

from .sources import eurostat, ine

log = logging.getLogger("esproblemas.pensions")

EUROSTAT_SERIES = {
    # Gasto en pensiones de vejez, Espana (% del PIB), 1990-actualidad
    "eu:pension_spend_es": ("spr_exp_pens", {
        "freq": "A", "spdepb": "OLD", "spdepm": "TOTAL", "unit": "PC_GDP", "geo": "ES",
    }),
    # Ratio de dependencia de mayores: 65+ por cada 100 personas de 20-64 (1975-actualidad)
    "eu:old_dep_es": ("demo_pjanind", {
        "freq": "A", "indic_de": "OLDDEP1", "geo": "ES",
    }),
    # Proyeccion de poblacion 65+ (escenario base), 2022-2100
    "eu:proj_old_es": ("proj_23np", {
        "freq": "A", "projection": "BSL", "sex": "T", "age": "Y_GE65", "unit": "PER", "geo": "ES",
    }),
    # Proyeccion de poblacion 20-64 (escenario base), 2022-2100
    "eu:proj_active_es": ("proj_23np", {
        "freq": "A", "projection": "BSL", "sex": "T", "age": "Y20-64", "unit": "PER", "geo": "ES",
    }),
    # Gasto publico en educacion, Espana (% del PIB), 1990-actualidad (COFOG GF09)
    "eu:edu_spend_es": ("gov_10a_exp", {
        "freq": "A", "sector": "S13", "unit": "PC_GDP", "na_item": "TE",
        "cofog99": "GF09", "geo": "ES",
    }),
    # Gasto publico en proteccion social, Espana (% del PIB), 1990-actualidad (COFOG GF10)
    "eu:social_spend_es": ("gov_10a_exp", {
        "freq": "A", "sector": "S13", "unit": "PC_GDP", "na_item": "TE",
        "cofog99": "GF10", "geo": "ES",
    }),
    # Tasa de reemplazo agregada de las pensiones (pension mediana 65-74 / salario mediano 50-59)
    "eu:replacement_es": ("ilc_pnp3", {
        "freq": "A", "sex": "T", "unit": "PC", "geo": "ES",
    }),
    # Esperanza de vida a los 65 anos (anos restantes)
    "eu:life_exp65_es": ("demo_mlexpec", {
        "freq": "A", "sex": "T", "age": "Y65", "unit": "YR", "geo": "ES",
    }),
    # Bono espanol a 10 anos (criterio de convergencia), tipo anual
    "eu:bond10y_es": ("irt_lt_mcby_a", {
        "freq": "A", "int_rt": "MCBY", "geo": "ES",
    }),
    # Inflacion de Espana (HICP, tasa anual, mensual) para calcular rentabilidad real
    "eu:hicp_es_m": ("prc_hicp_manr", {
        "coicop": "CP00", "unit": "RCH_A", "geo": "ES",
    }),
}

# Salario medio bruto anual (INE, Encuesta Anual de Estructura Salarial)
INE_SERIES = {
    "ine:salary_es": ("28185", "Ambos sexos. Todas las secciones. Dato base. Total Nacional. Salario medio bruto"),
}


def download_all() -> dict:
    """Descarga las series de pensiones (todas anuales y ligeras)."""
    store: dict = {}
    for series_id, (dataset, params) in EUROSTAT_SERIES.items():
        store[series_id] = eurostat.fetch_dataset(dataset, params)
        log.info("%s: %d obs (ultima %s)", series_id, len(store[series_id]),
                 max(store[series_id]))
    for series_id, (table, match) in INE_SERIES.items():
        series = ine.pick_series(ine.fetch_table(table), match)
        store[series_id] = ine.series_values(series)
        log.info("%s: %d obs (ultima %s)", series_id, len(store[series_id]),
                 max(store[series_id]))
    return store
