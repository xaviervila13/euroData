"""Series oficiales del problema de la vivienda (Eurostat + INE)."""

from __future__ import annotations

import logging

from .sources import eurostat, ine

log = logging.getLogger("esproblemas.housing")

EUROSTAT_SERIES = {
    # Indice de precios de la vivienda, Espana, total, trimestral (2015=100), 2005-actualidad
    "eu:hpi_es": ("prc_hpi_q", {
        "freq": "Q", "purchase": "TOTAL", "unit": "I15_Q", "geo": "ES",
    }),
    # Visados/permisos de edificacion de vivienda (edificios residenciales), anual (miles), 2005-2025
    "eu:permits_es": ("sts_cobp_a", {
        "freq": "A", "indic_bt": "BPRM_DW", "cpa2_1": "CPA_F41001_X_410014",
        "s_adj": "NSA", "unit": "THS", "geo": "ES",
    }),
    # Inmigracion anual, Espana, total (numero de personas), 1998-2024
    "eu:immigration_es": ("migr_imm1ctz", {
        "freq": "A", "citizen": "TOTAL", "agedef": "COMPLET", "age": "TOTAL",
        "unit": "NR", "sex": "T", "geo": "ES",
    }),
    # Poblacion a 1 de enero, Espana, total (numero de personas), 1960-2025
    "eu:population_es": ("demo_pjan", {
        "freq": "A", "sex": "T", "age": "TOTAL", "unit": "NR", "geo": "ES",
    }),
}

INE_SERIES = {
    # Hogares en viviendas familiares, total nacional (trimestral desde 2021)
    "ine:hogares_es": ("60133", "Total Nacional. Total. Hogares en viviendas familiares"),
    # Tamano medio del hogar (personas, trimestral desde 2021)
    "ine:tamano_hogar_es": ("60132", "Total Nacional. Tamaño medio del hogar"),
}


def download_all() -> dict:
    """Descarga las series de vivienda. Son pocas y ligeras: siempre completas."""
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
