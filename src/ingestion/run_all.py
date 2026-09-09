"""
src/ingestion/run_all.py

Phase 1 + 1b + 1c orchestrator -- the single entry point the README tells the
team to run: `python -m src.ingestion.run_all`.

Order of operations:
    1. Run selected connectors (Air India direct, IndiGo direct). A connector
       failure (e.g. site layout changed, rate-limiting) is logged and skipped
       -- it never crashes the run.
    2. Fill any remaining route/window gaps with the synthetic generator
       (Phase 1b) -- only what real data didn't reach.
    3. Persist everything to fare_quotes.
    4. Run cross-source validation (Phase 1c) on whatever real data landed
       from both sources, and persist the result to cross_source_check.
    5. Log every step to ingestion_runs (src/ingestion/run_log.py).
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import date, datetime, timezone
from typing import Any, Callable, Optional

import pandas as pd

from src.ingestion.connectors import FareRecord, ROUTES, ADVANCE_PURCHASE_DAYS
from src.ingestion.connectors.air_india_direct import AirIndiaDirectConnector
from src.ingestion.connectors.indigo_direct import IndiGoDirectConnector
from src.ingestion.synthetic_generator import fill_gaps
from src.ingestion.db_writer import save_fare_records
from src.ingestion.run_log import log_run_step
from src.validation.cross_source_check import compute_cross_source_differences, save_to_db

# Live status registry for active in-memory runs
CURRENT_PIPELINE_STATUS: dict[str, Any] = {
    "is_running": False,
    "current_run_id": None,
    "current_step": "idle",
    "progress_pct": 0,
    "logs": [],
    "last_run_summary": None,
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _log_step(
    run_id: uuid.UUID,
    step_name: str,
    started_at: datetime,
    records: int,
    error: Optional[Exception],
) -> None:
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
        print(f"[run_log] Could not log step '{step_name}': {log_exc}")


async def run_connector(
    connector,
    label: str,
    run_id: uuid.UUID,
    routes: Optional[list[str]] = None,
    advance_purchase_windows: Optional[list[int]] = None,
    progress_callback: Optional[Callable[[str], None]] = None,
) -> list[FareRecord]:
    started_at = _now()
    if progress_callback:
        progress_callback(f"Starting {label} extraction across {len(routes or ROUTES)} routes...")

    try:
        kwargs: dict[str, Any] = {}
        if routes:
            kwargs["routes"] = routes
        if advance_purchase_windows:
            kwargs["advance_purchase_windows"] = advance_purchase_windows

        records = await connector.fetch_all(**kwargs)
        msg = f"[{label}] fetched {len(records)} live records."
        print(msg)
        if progress_callback:
            progress_callback(msg)
        _log_step(run_id, label, started_at, len(records), None)
        return records
    except Exception as exc:
        msg = f"[{label}] FAILED — {exc}. Continuing without this source; gap-filler covers routes."
        print(msg)
        if progress_callback:
            progress_callback(msg)
        _log_step(run_id, label, started_at, 0, exc)
        return []


async def scrape_live_probe(
    carrier: str,
    route: str = "DEL-BOM",
    advance_purchase_days: int = 7,
) -> dict[str, Any]:
    """
    Test-scrape a single route & advance window live from Air India or IndiGo without persisting.
    Used for instant UI flight inspection and validation.
    """
    carrier_clean = carrier.lower().strip()
    if "indigo" in carrier_clean or "6e" in carrier_clean:
        connector = IndiGoDirectConnector()
        source_label = "indigo_direct"
    else:
        connector = AirIndiaDirectConnector()
        source_label = "air_india_direct"

    target_date = date.today()
    started_at = _now()

    try:
        records = await connector.fetch_all(
            routes=[route],
            advance_purchase_windows=[advance_purchase_days],
        )
        duration_sec = round((_now() - started_at).total_seconds(), 2)

        return {
            "success": True,
            "carrier": carrier,
            "source_name": source_label,
            "route": route,
            "advance_purchase_days": advance_purchase_days,
            "records_found": len(records),
            "duration_seconds": duration_sec,
            "quotes": [
                {
                    "route": r.route,
                    "carrier": r.carrier,
                    "travel_date": str(r.travel_date),
                    "advance_days": r.advance_purchase_days,
                    "total_fare": r.total_fare,
                    "base_fare": r.base_fare,
                    "taxes": r.taxes,
                    "is_sold_out": r.is_sold_out,
                    "data_origin": r.data_origin,
                    "channel": r.channel,
                    "provenance": r.provenance,
                }
                for r in records
            ],
        }
    except Exception as exc:
        return {
            "success": False,
            "carrier": carrier,
            "source_name": source_label,
            "route": route,
            "advance_purchase_days": advance_purchase_days,
            "records_found": 0,
            "error": str(exc),
        }


async def run_pipeline(
    sources: Optional[list[str]] = None,
    routes: Optional[list[str]] = None,
    advance_windows: Optional[list[int]] = None,
    do_gap_fill: bool = True,
    do_cross_validation: bool = True,
    run_id: Optional[uuid.UUID] = None,
) -> dict[str, Any]:
    """
    Parametric ingestion orchestrator with status telemetry.
    """
    actual_run_id = run_id or uuid.uuid4()
    run_id_str = str(actual_run_id)

    CURRENT_PIPELINE_STATUS["is_running"] = True
    CURRENT_PIPELINE_STATUS["current_run_id"] = run_id_str
    CURRENT_PIPELINE_STATUS["progress_pct"] = 10
    CURRENT_PIPELINE_STATUS["current_step"] = "initializing"
    CURRENT_PIPELINE_STATUS["logs"] = [f"[{_now().isoformat()}] Pipeline initialized with ID {run_id_str}"]

    def add_log(text: str) -> None:
        CURRENT_PIPELINE_STATUS["logs"].append(f"[{_now().isoformat()}] {text}")

    active_sources = sources or ["air_india_direct", "indigo_direct"]
    active_routes = routes or ["DEL-BOM", "DEL-BLR", "BOM-BLR"]
    active_windows = advance_windows or [7, 30]

    real_records: list[FareRecord] = []
    air_india_count = 0
    indigo_count = 0

    try:
        # Step 1: Air India
        if "air_india_direct" in active_sources:
            CURRENT_PIPELINE_STATUS["current_step"] = "scraping_air_india"
            CURRENT_PIPELINE_STATUS["progress_pct"] = 25
            add_log("Launching Air India Direct scraping engine...")
            ai_recs = await run_connector(
                AirIndiaDirectConnector(),
                "air_india_direct",
                actual_run_id,
                routes=active_routes,
                advance_purchase_windows=active_windows,
                progress_callback=add_log,
            )
            real_records.extend(ai_recs)
            air_india_count = len(ai_recs)

        # Step 2: IndiGo
        if "indigo_direct" in active_sources:
            CURRENT_PIPELINE_STATUS["current_step"] = "scraping_indigo"
            CURRENT_PIPELINE_STATUS["progress_pct"] = 50
            add_log("Launching IndiGo Direct scraping engine...")
            in_recs = await run_connector(
                IndiGoDirectConnector(),
                "indigo_direct",
                actual_run_id,
                routes=active_routes,
                advance_purchase_windows=active_windows,
                progress_callback=add_log,
            )
            real_records.extend(in_recs)
            indigo_count = len(in_recs)

        # Step 3: Persist real quotes
        CURRENT_PIPELINE_STATUS["current_step"] = "persisting_real"
        CURRENT_PIPELINE_STATUS["progress_pct"] = 70
        real_saved = save_fare_records(real_records)
        add_log(f"Saved {real_saved} live observed quotes to fare_quotes.")

        # Step 4: Synthetic Gap-Filler
        synthetic_saved = 0
        if do_gap_fill:
            CURRENT_PIPELINE_STATUS["current_step"] = "gap_filler"
            CURRENT_PIPELINE_STATUS["progress_pct"] = 80
            gap_started = _now()
            try:
                synthetic_records = fill_gaps(real_records)
                synthetic_saved = save_fare_records(synthetic_records)
                add_log(f"Synthetic gap-filler generated {synthetic_saved} records.")
                _log_step(actual_run_id, "synthetic_gap_filler", gap_started, synthetic_saved, None)
            except Exception as exc:
                add_log(f"Gap filler warning: {exc}")
                _log_step(actual_run_id, "synthetic_gap_filler", gap_started, 0, exc)

        # Step 5: Cross Source Validation
        cross_count = 0
        if do_cross_validation and real_records:
            CURRENT_PIPELINE_STATUS["current_step"] = "cross_source_validation"
            CURRENT_PIPELINE_STATUS["progress_pct"] = 90
            cross_started = _now()
            try:
                df = pd.DataFrame([r.__dict__ for r in real_records])
                cross_df = compute_cross_source_differences(df)
                cross_count = save_to_db(cross_df)
                add_log(f"Logged {cross_count} cross-source validation records.")
                _log_step(actual_run_id, "cross_source_validation", cross_started, cross_count, None)
            except Exception as exc:
                add_log(f"Cross-source validation warning: {exc}")
                _log_step(actual_run_id, "cross_source_validation", cross_started, 0, exc)

        CURRENT_PIPELINE_STATUS["progress_pct"] = 100
        CURRENT_PIPELINE_STATUS["current_step"] = "completed"
        add_log("APIx extraction pipeline completed successfully.")

        summary = {
            "run_id": run_id_str,
            "status": "success",
            "air_india_records": air_india_count,
            "indigo_records": indigo_count,
            "real_saved": real_saved,
            "synthetic_saved": synthetic_saved,
            "cross_source_comparisons": cross_count,
            "completed_at": _now().isoformat(),
        }
        CURRENT_PIPELINE_STATUS["last_run_summary"] = summary
        return summary

    except Exception as fatal_exc:
        CURRENT_PIPELINE_STATUS["current_step"] = "failed"
        add_log(f"Pipeline fatal error: {fatal_exc}")
        summary = {
            "run_id": run_id_str,
            "status": "failed",
            "error": str(fatal_exc),
            "completed_at": _now().isoformat(),
        }
        CURRENT_PIPELINE_STATUS["last_run_summary"] = summary
        return summary
    finally:
        CURRENT_PIPELINE_STATUS["is_running"] = False


async def main() -> None:
    print("--- APIx Ingestion Run: Phase 1 + 1b + 1c ---")
    summary = await run_pipeline()
    print(f"--- Ingestion run complete: {summary} ---")


if __name__ == "__main__":
    asyncio.run(main())
