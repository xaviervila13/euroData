"""Series oficiales del problema de la deuda publica (Eurostat)."""

from __future__ import annotations

import logging

from .sources import eurostat

log = logging.getLogger("esproblemas.debt")

EUROSTAT_SERIES = {
    # Deuda publica bruta, Espana, % del PIB (1995-actualidad)
    "eu:debt_gdp_es": ("gov_10dd_edpt1", {
        "freq": "A", "sector": "S13", "na_item": "GD", "unit": "PC_GDP", "geo": "ES",
    }),
    # Deuda publica bruta en millones de euros
    "eu:debt_eur_es": ("gov_10dd_edpt1", {
        "freq": "A", "sector": "S13", "na_item": "GD", "unit": "MIO_EUR", "geo": "ES",
    }),
    # Intereses pagados por la deuda, % del PIB
    "eu:interest_gdp_es": ("gov_10dd_edpt1", {
        "freq": "A", "sector": "S13", "na_item": "D41PAY", "unit": "PC_GDP", "geo": "ES",
    }),
    # Intereses pagados, millones de euros
    "eu:interest_eur_es": ("gov_10dd_edpt1", {
        "freq": "A", "sector": "S13", "na_item": "D41PAY", "unit": "MIO_EUR", "geo": "ES",
    }),
    # Gasto por funcion (COFOG, % del PIB) para comparar con la factura de los intereses
    "eu:cofog_health_es": ("gov_10a_exp", {
        "freq": "A", "sector": "S13", "unit": "PC_GDP", "na_item": "TE", "cofog99": "GF07", "geo": "ES",
    }),
    "eu:cofog_education_es": ("gov_10a_exp", {
        "freq": "A", "sector": "S13", "unit": "PC_GDP", "na_item": "TE", "cofog99": "GF09", "geo": "ES",
    }),
    "eu:cofog_publicorder_es": ("gov_10a_exp", {
        "freq": "A", "sector": "S13", "unit": "PC_GDP", "na_item": "TE", "cofog99": "GF03", "geo": "ES",
    }),
    "eu:cofog_culture_es": ("gov_10a_exp", {
        "freq": "A", "sector": "S13", "unit": "PC_GDP", "na_item": "TE", "cofog99": "GF08", "geo": "ES",
    }),
    "eu:cofog_environment_es": ("gov_10a_exp", {
        "freq": "A", "sector": "S13", "unit": "PC_GDP", "na_item": "TE", "cofog99": "GF05", "geo": "ES",
    }),
    "eu:cofog_defence_es": ("gov_10a_exp", {
        "freq": "A", "sector": "S13", "unit": "PC_GDP", "na_item": "TE", "cofog99": "GF02", "geo": "ES",
    }),
}


def download_all() -> dict:
    """Descarga las series de deuda publica (todas anuales y ligeras)."""
    store: dict = {}
    for series_id, (dataset, params) in EUROSTAT_SERIES.items():
        store[series_id] = eurostat.fetch_dataset(dataset, params)
        log.info("%s: %d obs (ultima %s)", series_id, len(store[series_id]),
                 max(store[series_id]))
    return store
