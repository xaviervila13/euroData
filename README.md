# ESProblemas

Los grandes problemas económicos de España, con datos oficiales. Bilingüe ES/EN.

**Ahora mismo:**

- **Problema 01 · Vivienda**: índice de precios un 33% por encima del pico de 2007, visados de obra nueva un 73% por debajo del máximo de 2006, hogares +1,3 M desde 2021 — con las causas de raíz y las soluciones propuestas.
- **Problema 02 · Inflación**: por qué tu euro compra cada vez menos. Tarjetas de poder de compra (100 € de 1999 compran hoy ~179 €; los ahorros sin interés pierden ~24% en una década), contador en vivo de creación de dinero (~15.600 €/s), gráfico de M3 desde 1980, el carrito de la compra medido en euros (+82% desde 1999) y en oro (−88%: una onza compra hoy más de ocho veces lo de 1999), mitos, causas y soluciones monetarias (patrón oro con su coste real, banca libre, reservas al 100%, objetivo 0% y deflación benigna por productividad) y slider de precios con el HICP oficial.
- **Problema 03 · Pensiones**: el sistema de reparto como promesa política, no como cuenta propia, con **estimación propia hasta 2050** (elasticidad observada gasto/dependencia, marcada como estimación), **comparación con educación** (protección social 18,7% del PIB frente a 4,1% en 2024) y un **simulador de cuenta individual**: para un salario medio (29.540 €, INE) cotizando el 37% durante 40 años, el capital acumulado sería de 660 k€ (2% real) a 1,69 M€ (6% real), frente a los 524 k€ que el sistema devuelve en total (con la esperanza de vida oficial de 21,9 años). Incluye la aclaración de rentabilidad **real** (descontada la inflación) y **referencias históricas calculadas**: deuda pública española +0,95% real (1999-2025, Eurostat) y −0,63% (última década), deuda EE.UU. +1,12% y renta variable EE.UU. **+7,62% real (1945-2025)**. Gasto en pensiones del 6,7% al 9,3% del PIB (2011-2024) y la dependencia (65+ por 100 de 20-64) subiendo de 31 a **59 en 2050** (proyección de Eurostat, misma definición que la serie observada) según Eurostat, con mitos, causas y una propuesta de cuentas individuales capitalizadas.
- **Problema 04 · Deuda pública**: 1,70 billones de euros (récord) y tendencia al alza; los intereses ya cuestan 40.314 M€/año, más que vivienda, medio ambiente, cultura, defensa y orden público por separado. Incluye la evolución de la deuda en euros año a año (el stock sube cada año, sin bajar nunca), la comparación de la factura de intereses con otras partidas (COFOG) y mitos, causas y soluciones (entre ellos, que el Estado no puede endeudarse sin límite).
- **FAQ** por problema y fuentes enlazadas para verificar cada dato.

El contador en vivo es client-side: el navegador interpola `base + (ahora − fecha_base) × €/s` a partir del último dato oficial (lag típico: 3-4 semanas).

## Arquitectura

```
backend/                    API FastAPI + ETL programado (Python 3.12)
  app/sources/ecb.py        BCE (SDMX, format=csvdata)
  app/sources/eurostat.py   Eurostat (JSON-stat 2.0)
  app/sources/ine.py        INE (Tempus3 / INEbase, JSON)
  app/housing.py            series del problema de vivienda
  app/payload.py            construccion del JSON (monetary + hicp + problems)
  app/etl.py                orquestacion: descarga -> Postgres
  app/scheduler.py          APScheduler: diario 06:00 UTC + bootstrap si la BD esta vacia
  app/main.py               /api/data · /api/health · /api/refresh
frontend/                   Nginx: estatico + proxy /api/ -> backend
  assets/                   app.js · i18n.js · style.css
  data/data.json            snapshot de respaldo (si la API no responde)
  tests/dom_smoke.js        smoke test del frontend (node, sin dependencias)
scripts/update_snapshot.py  regenera el snapshot sin base de datos
docker-compose.yml          db (Postgres 16) + backend + frontend
```

## Despliegue en un VPS

Requisitos: Docker + Docker Compose v2.

```bash
git clone https://github.com/xaviervila13/euroData.git && cd euroData
cp .env.example .env          # edita POSTGRES_PASSWORD y PUBLIC_PORT
docker compose up -d --build  # sirve en http://IP_DEL_VPS
```

La primera vez el backend detecta la BD vacía y descarga todas las series (~60 s). Comprobar:

```bash
curl -s localhost/api/health
curl -s localhost/api/data | head -c 300
```

Actualizar: `git pull && docker compose up -d --build`. HTTPS: añade delante Caddy, Traefik o Cloudflare.

## Variables de entorno (`.env`)

| Variable | Por defecto | Descripción |
|---|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` | `eurodata` | Base de datos |
| `POSTGRES_PASSWORD` | — (obligatoria) | Contraseña de Postgres |
| `PUBLIC_PORT` | `80` | Puerto público del sitio |
| `REFRESH_TOKEN` | vacío | Habilita `POST /api/refresh` (token) |
| `ETL_CRON_HOUR` | `6` | Hora UTC del ETL diario |
| `LOG_LEVEL` | `INFO` | Nivel de log del backend |

## API

| Endpoint | Descripción |
|---|---|
| `GET /api/data` | Payload completo (monetary, hicp, problems, meta); cacheado 5 min |
| `GET /api/health` | Estado, nº de observaciones y última ejecución del ETL |
| `POST /api/refresh?full=false` | Lanza el ETL a mano (requiere `X-Refresh-Token` o `?token=`) |

```bash
curl -X POST -H "X-Refresh-Token: $REFRESH_TOKEN" "localhost/api/refresh"
docker compose exec backend python -m app.etl_cli --full   # historico completo
```

## Desarrollo local

Frontend sin backend (usa el snapshot):

```bash
python3 scripts/update_snapshot.py    # regenera frontend/data/data.json
cd frontend && python3 -m http.server 8080
```

Backend en local contra un Postgres de pruebas:

```bash
docker run -d --name europg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16-alpine
python3 -m venv .venv && . .venv/bin/activate && pip install -r backend/requirements.txt
cd backend
DATABASE_URL=postgresql://postgres:dev@localhost:5432/postgres python -m app.etl_cli --full
DATABASE_URL=postgresql://postgres:dev@localhost:5432/postgres uvicorn app.main:app --reload
```

## Tests

```bash
node frontend/tests/dom_smoke.js   # smoke test del frontend (sin dependencias)
```

## Fuentes oficiales

| Problema | Serie | Fuente | Clave / tabla |
|---|---|---|---|
| Vivienda | Precio de la vivienda (trimestral, 2015=100) | Eurostat | `prc_hpi_q` (ES, TOTAL) |
| Vivienda | Visados de obra nueva (anual, miles) | Eurostat | `sts_cobp_a` (BPRM_DW, CPA_F41001_X_410014) |
| Vivienda | Inmigración anual (1998-) | Eurostat | `migr_imm1ctz` |
| Vivienda | Población (1960-) | Eurostat | `demo_pjan` |
| Vivienda | Hogares y tamaño medio del hogar (trimestral) | INE | tablas 60133 y 60132 |
| Inflación | M3 / M2 / M1 de la eurozona (mensual, 1980-) | BCE | `BSI.M.U2.Y.V.M30/M20/M10...` |
| Inflación | HICP índices y tasa (1996-) | BCE/Eurostat | `ICP...INX/ANR` + `HICP...4D0.INX/ANR` |
| Inflación | PIB real per cápita ES (2000-) | Eurostat | `sdg_08_10` (CLV20_EUR_HAB) |
| Inflación | Oro LBMA en EUR, mensual (1999-) | World Gold Council | `lbma_am_eur` (fsapi.gold.org) |
| Pensiones | Gasto en pensiones de vejez (% PIB, 1995-) | Eurostat | `spr_exp_pens` (spdepb=OLD, PC_GDP) |
| Pensiones | Dependencia de mayores 65+/20-64 (1960-) | Eurostat | `demo_pjanind` (OLDDEP1) |
| Pensiones | Proyección de población 65+ y 20-64 (2022-2100) | Eurostat | `proj_23np` (BSL) |
| Pensiones | Gasto en educación y protección social (% PIB, 1990-) | Eurostat | `gov_10a_exp` (COFOG GF09/GF10, na_item=TE) |
| Pensiones | Salario medio bruto anual (2008-) | INE | tabla 28185 (EAES) |
| Pensiones | Tasa de reemplazo de las pensiones (2010-) | Eurostat | `ilc_pnp3` |
| Pensiones | Esperanza de vida a los 65 años (1975-) | Eurostat | `demo_mlexpec` (Y65) |
| Pensiones | Bono español a 10 años (1978-) | Eurostat | `irt_lt_mcby_a` |
| Pensiones | Inflación de España (1997-) | Eurostat | `prc_hicp_manr` (CP00) |
| Pensiones | Rentabilidad real acciones/bonos EE.UU. (1928-) | Damodaran (NYU, académico) | `histretSP.xls` |
| Deuda | Deuda pública e intereses (% PIB y M€, 1995-) | Eurostat | `gov_10dd_edpt1` (GD, D41PAY) |
| Deuda | Gasto por función para comparar con los intereses (COFOG) | Eurostat | `gov_10a_exp` (GF02/03/05/07/08/09) |

El cambio metodológico del HICP (feb-2026) partió las series: el ETL encadena ambas bases en dic-2025 usando el solapamiento 2024-2025.

## Criterio editorial

Los datos son oficiales y verificables (enlazados en cada gráfico). La interpretación de las causas de cada problema es editorial; los datos son oficiales, verificables y están enlazados en cada gráfico.

## Licencia

Datos: INE, Eurostat y Banco Central Europeo (reutilización con atribución). Código: libre. Sitio no afiliado a ninguna administración.
