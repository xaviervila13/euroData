# ECB Money Printer

Rastreador en tiempo real de la masa monetaria de la eurozona, inspirado en [Fed Money Printer](https://tryneoapp.com/fed-money-printer) pero con datos oficiales del [ECB Data Portal](https://data.ecb.europa.eu/). Bilingüe ES/EN.

**Qué muestra:**

- **Contador en vivo** de M3 (el agregado monetario más amplio de la eurozona), interpolando linealmente los últimos datos mensuales oficiales (~20.000 €/s de media en los últimos meses).
- **Gráfico histórico de M3** desde 1980, con el pico del QE de 2020-2021 destacado.
- **Slider de inflación** con 6 categorías oficiales del HICP («100 € de 1996 → X € hoy») y 4 artículos emblemáticos aproximados.
- **FAQ** completa sobre impresión de dinero, M3, efecto Cantillon y límites de los datos.

## Arquitectura

```
scripts/fetch_ecb.py   ETL sin dependencias: ECB Data Portal API → data/history.sqlite → data/data.json
data/history.sqlite    Histórico canónico (se commitea)
data/data.json         Snapshot (~100 KB) que consume el frontend
index.html + assets/   Sitio estático (odómetro, gráfico, slider, i18n ES/EN)
.github/workflows/     Cron diario 06:00 UTC: ETL → commit → deploy a GitHub Pages
```

El "tiempo real" es client-side: el navegador interpola `base + (ahora − fecha_base) × €/s`, igual que la original. La etiqueta **«último dato oficial»** indica hasta dónde llega el dato real (lag típico: 3-4 semanas, como FRED).

## Series usadas

| Uso | Dataset | Clave SDMX |
|---|---|---|
| Contador y gráfico (M3) | BSI | `BSI.M.U2.Y.V.M30.X.1.U2.2300.Z01.E` |
| Detalle M2 / M1 | BSI | `BSI.M.U2.Y.V.M20...` / `BSI.M.U2.Y.V.M10...` |
| HICP índices (2015=100, hasta dic-2025) | ICP | `ICP.M.U2.N.{código}.4.INX` |
| HICP índices (2025=100, desde 2024) | HICP | `HICP.M.U2.N.{código}.4D0.INX` |

Códigos HICP: `000000` general, `011000` alimentación, `045000` electricidad y gas, `041100` alquileres, `070000` transporte, `111000` restaurantes y bares.

El cambio metodológico del HICP (feb-2026) partió las series: el ETL encadena ambas bases en dic-2025 usando el solapamiento 2024-2025. Documentado en la FAQ del sitio.

## Desarrollo local

```bash
python3 scripts/fetch_ecb.py --full   # histórico completo (primera vez)
python3 scripts/fetch_ecb.py          # update incremental
python3 -m http.server 8080           # http://localhost:8080
```

Sin dependencias externas (solo stdlib de Python).

## Deploy

1. Crea un repo en GitHub y haz push de este proyecto a `main`.
2. En el repo: **Settings → Pages → Source: GitHub Actions**.
3. El workflow corre en cada push y a diario a las 06:00 UTC (ETL + deploy). Puedes lanzarlo a mano con **Run workflow**.

Si la API del BCE falla, el ETL reintenta y, si no hay éxito, no toca `data.json` (el sitio sigue sirviendo los datos anteriores).

## Personalizar

- **Artículos emblemáticos**: edita `EMBLEMATIC_ITEMS` en `scripts/fetch_ecb.py` y vuelve a ejecutar el ETL.
- **Años del slider**: `SLIDER_YEARS` en el mismo fichero.
- **Categorías HICP**: `HICP_CATEGORIES` (códigos válidos en el portal del BCE).

## Licencia

Datos: © European Central Bank, [CC BY 4.0](https://www.ecb.europa.eu/terms/html/index.en.html#licensing). Código del sitio: libre. Sitio no afiliado al BCE.
