"""CLI del ETL contra Postgres.

Uso dentro del contenedor o en local con las dependencias instaladas:
    python -m app.etl_cli [--full] [--snapshot frontend/data/data.json]
"""

from __future__ import annotations

import argparse
import logging
import sys

from . import db, etl


def main() -> int:
    logging.basicConfig(level="INFO", format="%(levelname)s %(name)s: %(message)s")
    parser = argparse.ArgumentParser(description="ETL ECB -> Postgres")
    parser.add_argument("--full", action="store_true", help="recarga el historico completo")
    parser.add_argument("--snapshot", help="escribe tambien un data.json en esta ruta")
    args = parser.parse_args()

    pool = db.init()
    try:
        result = etl.run(pool, full=args.full)
        if args.snapshot:
            etl.write_snapshot(pool, args.snapshot)
        print(result)
    finally:
        pool.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
