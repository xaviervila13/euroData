# ESProblemas

Los grandes problemas económicos de España, con datos oficiales y análisis liberal. Bilingüe ES/EN.

**Ahora mismo:**

- **Problema 01 · Vivienda**: índice de precios un 33% por encima del pico de 2007, visados de obra nueva un 73% por debajo del máximo de 2006, hogares +1,3 M desde 2021 — con las causas de raíz y las soluciones liberales.
- **Problema 02 · Dinero**: M3 de la eurozona en ~17,6 billones de € con contador en vivo (~15.600 €/s), gráfico histórico desde 1980 y slider de inflación con el HICP oficial.
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
| Vivienda | Inmigración anual | Eurostat | `tps00176` |
| Vivienda | Población (1960-) | Eurostat | `demo_pjan` |
| Vivienda | Hogares y tamaño medio del hogar (trimestral) | INE | tablas 60133 y 60132 |
| Dinero | M3 / M2 / M1 de la eurozona (mensual, 1980-) | BCE | `BSI.M.U2.Y.V.M30/M20/M10...` |
| Dinero | HICP índices y tasa (1996-) | BCE/Eurostat | `ICP...INX/ANR` + `HICP...4D0.INX/ANR` |

El cambio metodológico del HICP (feb-2026) partió las series: el ETL encadena ambas bases en dic-2025 usando el solapamiento 2024-2025.

## Criterio editorial

Los datos son oficiales y verificables (enlazados en cada gráfico). La interpretación de las causas sigue el marco liberal de la escuela austriaca (Juan Ramón Rallo, Instituto Juan de Mariana), citado en la sección de fuentes de cada problema.

## Licencia

Datos: INE, Eurostat y Banco Central Europeo (reutilización con atribución). Código: libre. Sitio no afiliado a ninguna administración.
