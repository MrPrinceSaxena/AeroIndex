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

Every step also logs to ingestion_runs (src/ingestion/run_log.py) -- this is
what the System Health page reads to show real pipeline history instead of a
guess. Logging wraps the existing steps; it never changes their tolerant
control flow (a connector failure still doesn't stop the run).
"""

import asyncio
import uuid
from datetime import datetime, timezone

import pandas as pd

from src.ingestion.connectors import FareRecord
from src.ingestion.connectors.air_india_direct import AirIndiaDirectConnector
from src.ingestion.connectors.indigo_direct import IndiGoDirectConnector
from src.ingestion.synthetic_generator import fill_gaps
from src.ingestion.db_writer import save_fare_records
from src.ingestion.run_log import log_run_step
from src.validation.cross_source_check import compute_cross_source_differences, save_to_db


def _now() -> datetime:
    return datetime.now(timezone.utc)


from typing import Optional
def _log_step(run_id: uuid.UUID, step_name: str, started_at: datetime, records: int, error: Optional[Exception]) -> None:
    try:
        log_run_step(
            run_id=run_id,
            step_name=step_name,
            started_at=started_at,
            finished_at=_now(),
            status="failed" if error else "success",
            records_ingested=records,
            error_message=str(error) if error else None,
        )
    except Exception as log_exc:
        # Logging the run must never itself take down the run.
        print(f"[run_log] Could not log step '{step_name}': {log_exc}")


async def run_connector(connector, label: str, run_id: uuid.UUID) -> list[FareRecord]:
    started_at = _now()
    try:
        records = await connector.fetch_all()
        print(f"[{label}] fetched {len(records)} records.")
        _log_step(run_id, label, started_at, len(records), None)
        return records
    except Exception as exc:
        print(
            f"[{label}] FAILED — {exc}. Continuing without this source; "
            f"the synthetic gap-filler will cover its routes."
        )
        _log_step(run_id, label, started_at, 0, exc)
        return []


async def main() -> None:
    print("--- APIx Ingestion Run: Phase 1 + 1b + 1c ---")
    run_id = uuid.uuid4()

    air_india_records = await run_connector(AirIndiaDirectConnector(), "air_india_direct", run_id)
    indigo_records = await run_connector(IndiGoDirectConnector(), "indigo_direct", run_id)

    real_records = air_india_records + indigo_records
    real_saved = save_fare_records(real_records)

    gap_filler_started = _now()
    try:
        synthetic_records = fill_gaps(real_records)
        synthetic_saved = save_fare_records(synthetic_records)
        print(
            f"Synthetic gap-filler: {len(synthetic_records)} records "
            f"(routes/windows the real scrapers did not cover)."
        )
        _log_step(run_id, "synthetic_gap_filler", gap_filler_started, synthetic_saved, None)
    except Exception as exc:
        print(f"[synthetic_gap_filler] FAILED — {exc}.")
        synthetic_saved = 0
        _log_step(run_id, "synthetic_gap_filler", gap_filler_started, 0, exc)

    cross_validation_started = _now()
    if real_records:
        try:
            df = pd.DataFrame([r.__dict__ for r in real_records])
            cross_df = compute_cross_source_differences(df)
            n_logged = save_to_db(cross_df)
            _log_step(run_id, "cross_source_validation", cross_validation_started, n_logged, None)
        except Exception as exc:
            print(f"[cross_source_validation] FAILED — {exc}.")
            _log_step(run_id, "cross_source_validation", cross_validation_started, 0, exc)
    else:
        _log_step(run_id, "cross_source_validation", cross_validation_started, 0, None)

    print(
        f"--- Ingestion run complete: {real_saved} real, "
        f"{synthetic_saved} synthetic records saved. ---"
    )


if __name__ == "__main__":
    asyncio.run(main())
