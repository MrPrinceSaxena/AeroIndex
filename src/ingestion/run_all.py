"""
src/ingestion/run_all.py

Phase 1 + 1b + 1c orchestrator -- the single entry point the README tells the
team to run: `python -m src.ingestion.run_all`.

Order of operations:
    1. Run both real connectors (Air India direct, IndiGo direct). A connector
       failure (e.g. site layout changed, robots.txt not yet re-verified) is
       logged and skipped -- it must never crash the whole run, since one
       broken scraper should not block the gap-filler from covering for it.
    2. Fill any remaining route/window gaps with the synthetic generator
       (Phase 1b) -- only what real data didn't reach.
    3. Persist everything to fare_quotes.
    4. Run cross-source validation (Phase 1c) on whatever real data landed
       from both sources, and persist the result to cross_source_check.
"""

import asyncio

import pandas as pd

from src.ingestion.connectors import FareRecord
from src.ingestion.connectors.air_india_direct import AirIndiaDirectConnector
from src.ingestion.connectors.indigo_direct import IndiGoDirectConnector
from src.ingestion.synthetic_generator import fill_gaps
from src.ingestion.db_writer import save_fare_records
from src.validation.cross_source_check import compute_cross_source_differences, save_to_db


async def run_connector(connector, label: str) -> list[FareRecord]:
    try:
        records = await connector.fetch_all()
        print(f"[{label}] fetched {len(records)} records.")
        return records
    except Exception as exc:
        print(
            f"[{label}] FAILED — {exc}. Continuing without this source; "
            f"the synthetic gap-filler will cover its routes."
        )
        return []


async def main() -> None:
    print("--- APIx Ingestion Run: Phase 1 + 1b + 1c ---")

    air_india_records = await run_connector(AirIndiaDirectConnector(), "air_india_direct")
    indigo_records = await run_connector(IndiGoDirectConnector(), "indigo_direct")

    real_records = air_india_records + indigo_records
    real_saved = save_fare_records(real_records)

    synthetic_records = fill_gaps(real_records)
    synthetic_saved = save_fare_records(synthetic_records)
    print(
        f"Synthetic gap-filler: {len(synthetic_records)} records "
        f"(routes/windows the real scrapers did not cover)."
    )

    if real_records:
        df = pd.DataFrame([r.__dict__ for r in real_records])
        cross_df = compute_cross_source_differences(df)
        save_to_db(cross_df)

    print(
        f"--- Ingestion run complete: {real_saved} real, "
        f"{synthetic_saved} synthetic records saved. ---"
    )


if __name__ == "__main__":
    asyncio.run(main())
