"""Series oficiales para el problema de la inflacion (Eurostat + BCE)."""

from __future__ import annotations

import logging

from .sources import eurostat, gold

log = logging.getLogger("esproblemas.inflation")

EUROSTAT_SERIES = {
    # PIB real per capita, Espana (volumen encadenado 2020, euros por habitante)
    "eu:gdp_pc_es": ("sdg_08_10", {
        "freq": "A", "unit": "CLV20_EUR_HAB", "na_item": "B1GQ", "geo": "ES",
    }),
    # PIB real per capita, media UE-27 (referencia de comparacion)
    "eu:gdp_pc_eu": ("sdg_08_10", {
        "freq": "A", "unit": "CLV20_EUR_HAB", "na_item": "B1GQ", "geo": "EU27_2020",
    }),
}


def download_all() -> dict:
    """Descarga las series de inflacion y el fixing del oro."""
    store: dict = {}
    for series_id, (dataset, params) in EUROSTAT_SERIES.items():
        store[series_id] = eurostat.fetch_dataset(dataset, params)
        log.info("%s: %d obs (ultima %s)", series_id, len(store[series_id]),
                 max(store[series_id]))
    store.update(gold.download_all())
    return store
