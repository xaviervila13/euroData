# Euro Printer

Rastreador en tiempo real de la masa monetaria de la eurozona, inspirado en [Fed Money Printer](https://tryneoapp.com/fed-money-printer) pero con datos oficiales del [ECB Data Portal](https://data.ecb.europa.eu/). Bilingüe ES/EN.

**Qué muestra:**

- **Contador en vivo** de M3 (el agregado monetario más amplio de la eurozona), interpolando los últimos datos mensuales oficiales.
- **Gráfico histórico de M3** desde 1980, con el pico del QE de 2020-2021 destacado.
- **Slider de inflación** con 6 categorías oficiales del HICP («100 € de 1996 → X € hoy») y 4 artículos emblemáticos aproximados.
- **FAQ** sobre impresión de dinero, M3, efecto Cantillon y límites de los datos.

## Arquitectura

```
backend/                 API FastAPI + ETL programado (Python 3.12)
  app/ecb.py             Descarga y transformación del ECB Data Portal (solo stdlib)
  app/db.py              Pool Postgres, esquema y operaciones
  app/etl.py             Orquestación: descarga → Postgres
  app/scheduler.py       APScheduler: diario 06:00 UTC + bootstrap si la BD está vacía
  app/main.py            Rutas /api/data, /api/health, /api/refresh
frontend/                Nginx: estático + proxy /api/ → backend
  assets/                app.js, i18n.js, style.css
  data/data.json         Snapshot de respaldo (si la API no responde)
scripts/fetch_ecb.py     Regenera el snapshot sin base de datos
docker-compose.yml       db (Postgres 16) + backend + frontend
```

Flujo: el backend descarga del BCE al arrancar y cada día a las 06:00 UTC, guarda en Postgres y sirve `GET /api/data` (mismo JSON que consume el frontend). El "tiempo real" es client-side: el navegador interpola `base + (ahora − fecha_base) × €/s`. La etiqueta **«último dato oficial»** indica hasta dónde llega el dato real (lag típico: 3-4 semanas).

## Despliegue en un VPS

Requisitos: Docker + Docker Compose.

```bash
git clone https://github.com/xaviervila13/euroData.git && cd euroData
cp .env.example .env          # edita POSTGRES_PASSWORD y PUBLIC_PORT
docker compose up -d --build  # sirve en http://IP_DEL_VPS
```

La primera vez, el backend detecta la BD vacía y descarga todo el histórico automáticamente (tarda ~15 s). Comprobar:

```bash
curl -s localhost/api/health
curl -s localhost/api/data | head -c 300
```

Actualizar tras un `git pull`:

```bash
git pull && docker compose up -d --build
```

> Con la versión antigua de Compose v1 usa `docker-compose` en lugar de `docker compose`.

HTTPS/dominio: apunta el DNS al VPS y añade delante Caddy, Traefik o Cloudflare; el stack escucha en `PUBLIC_PORT` y no necesita saber nada del dominio.

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
| `GET /api/data` | Payload completo (monetary, hicp, items, meta); cacheado 5 min |
| `GET /api/health` | Estado, nº de observaciones, última ejecución del ETL |
| `POST /api/refresh?full=false` | Lanza el ETL a mano (requiere `X-Refresh-Token` o `?token=`) |

Ejemplo de actualización manual:

```bash
curl -X POST -H "X-Refresh-Token: $REFRESH_TOKEN" "localhost/api/refresh"
docker compose exec backend python -m app.etl_cli --full   # historico completo
```

## Desarrollo local

Frontend sin backend (usa el snapshot):

```bash
python3 scripts/fetch_ecb.py            # regenera frontend/data/data.json
cd frontend && python3 -m http.server 8080
```

Backend en local contra un Postgres de pruebas:

```bash
docker run -d --name europg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16-alpine
python3 -m venv .venv && . .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
DATABASE_URL=postgresql://postgres:dev@localhost:5432/postgres python -m app.etl_cli --full
DATABASE_URL=postgresql://postgres:dev@localhost:5432/postgres uvicorn app.main:app --reload
```

## Tests

```bash
node frontend/tests/dom_smoke.js   # smoke test del frontend (sin dependencias)
```

## Backup

```bash
docker compose exec db pg_dump -U eurodata eurodata > backup_$(date +%F).sql
```

## Series usadas

| Uso | Dataset | Clave SDMX |
|---|---|---|
| Contador y gráfico (M3) | BSI | `BSI.M.U2.Y.V.M30.X.1.U2.2300.Z01.E` |
| Detalle M2 / M1 | BSI | `BSI.M.U2.Y.V.M20...` / `BSI.M.U2.Y.V.M10...` |
| HICP índices (2015=100, hasta dic-2025) | ICP | `ICP.M.U2.N.{código}.4.INX` |
| HICP índices (2025=100, desde 2024) | HICP | `HICP.M.U2.N.{código}.4D0.INX` |

Códigos HICP: `000000` general, `011000` alimentación, `045000` electricidad y gas, `041100` alquileres, `070000` transporte, `111000` restaurantes y bares.

El cambio metodológico del HICP (feb-2026) partió las series: el ETL encadena ambas bases en dic-2025 usando el solapamiento 2024-2025.

## Licencia

Datos: © European Central Bank, [CC BY 4.0](https://www.ecb.europa.eu/terms/html/index.en.html#licensing). Código del sitio: libre. Sitio no afiliado al BCE.
