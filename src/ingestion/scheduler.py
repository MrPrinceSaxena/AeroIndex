"""
src/ingestion/scheduler.py

Automated daily scheduler for the APIx ingestion pipeline.
Meets SIH 26056 headline requirement: "capable of scheduled daily extraction".

Features:
- Configurable cron/interval execution via APScheduler
- Direct execution hook (trigger_now) for on-demand runs
- Telemetry logged to ingestion_runs table on each execution
- Graceful startup and shutdown for FastAPI lifespans and standalone daemon mode
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from dotenv import load_dotenv

from src.ingestion.run_all import run_pipeline, CURRENT_PIPELINE_STATUS

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

logger = logging.getLogger("apix.scheduler")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [scheduler] %(message)s",
)

DEFAULT_SCHEDULE_HOUR = int(os.getenv("SCHEDULE_CRON_HOUR", "6"))  # 06:00 UTC
DEFAULT_SCHEDULE_MINUTE = int(os.getenv("SCHEDULE_CRON_MINUTE", "0"))


class APIxScheduler:
    """
    Manages background scheduled executions of the APIx ingestion engine.
    """

    def __init__(self, scheduler: Optional[AsyncIOScheduler] = None):
        self.scheduler = scheduler or AsyncIOScheduler()
        self.is_running = False
        self._job_id = "apix_daily_ingestion"

    async def _scheduled_job_wrapper(self) -> None:
        """Wrapper executed on schedule with error isolation."""
        logger.info("Executing scheduled APIx ingestion run...")
        try:
            summary = await run_pipeline()
            logger.info("Scheduled APIx ingestion run finished successfully: %s", summary)
        except Exception as exc:
            logger.error("Scheduled APIx ingestion encountered an unexpected error: %s", exc, exc_info=True)

    def start(
        self,
        hour: int = DEFAULT_SCHEDULE_HOUR,
        minute: int = DEFAULT_SCHEDULE_MINUTE,
        interval_hours: Optional[int] = None,
    ) -> None:
        """
        Start the scheduler.
        If interval_hours is provided, runs every N hours.
        Otherwise, runs daily at specified hour:minute.
        """
        if self.is_running:
            logger.warning("Scheduler is already running.")
            return

        if interval_hours:
            trigger = IntervalTrigger(hours=interval_hours)
            logger.info("Configured interval trigger: every %d hours", interval_hours)
        else:
            trigger = CronTrigger(hour=hour, minute=minute, timezone="UTC")
            logger.info("Configured daily cron trigger: %02d:%02d UTC", hour, minute)

        self.scheduler.add_job(
            self._scheduled_job_wrapper,
            trigger=trigger,
            id=self._job_id,
            replace_existing=True,
            misfire_grace_time=3600,
        )
        self.scheduler.start()
        self.is_running = True
        logger.info("APIx scheduler started successfully.")

    def shutdown(self, wait: bool = False) -> None:
        """Stop the background scheduler."""
        if self.is_running:
            self.scheduler.shutdown(wait=wait)
            self.is_running = False
            logger.info("APIx scheduler stopped.")

    async def trigger_now(
        self,
        sources: Optional[list[str]] = None,
        routes: Optional[list[str]] = None,
        advance_windows: Optional[list[int]] = None,
        do_gap_fill: bool = True,
    ) -> dict[str, Any]:
        """Trigger an immediate ingestion run on demand with optional filters."""
        logger.info("Triggering on-demand ingestion run...")
        return await run_pipeline(
            sources=sources,
            routes=routes,
            advance_windows=advance_windows,
            do_gap_fill=do_gap_fill,
        )


# Global instance for app lifecycle hooks
global_scheduler = APIxScheduler()


async def run_standalone() -> None:
    """Standalone CLI entry point for scheduled background execution."""
    parser = argparse.ArgumentParser(description="APIx Scheduled Ingestion Runner")
    parser.add_argument("--now", action="store_true", help="Execute an immediate ingestion run and exit")
    parser.add_argument("--interval-hours", type=int, default=None, help="Run every N hours instead of daily cron")
    parser.add_argument("--hour", type=int, default=DEFAULT_SCHEDULE_HOUR, help="Daily cron hour (0-23 UTC)")
    parser.add_argument("--minute", type=int, default=DEFAULT_SCHEDULE_MINUTE, help="Daily cron minute (0-59)")
    args = parser.parse_args()

    scheduler = APIxScheduler()

    if args.now:
        logger.info("Running single immediate extraction as requested by --now")
        await scheduler.trigger_now()
        return

    scheduler.start(hour=args.hour, minute=args.minute, interval_hours=args.interval_hours)
    logger.info("Scheduler daemon running. Press Ctrl+C to terminate.")

    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Received exit signal.")
    finally:
        scheduler.shutdown(wait=False)


if __name__ == "__main__":
    asyncio.run(run_standalone())
