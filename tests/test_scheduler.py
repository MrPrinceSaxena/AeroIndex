"""
tests/test_scheduler.py

Unit tests for APIxScheduler (APScheduler daily ingestion runner).
"""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from src.ingestion.scheduler import APIxScheduler


@pytest.mark.asyncio
async def test_scheduler_start_and_shutdown():
    mock_sched = MagicMock(spec=AsyncIOScheduler)
    scheduler = APIxScheduler(scheduler=mock_sched)

    assert not scheduler.is_running
    scheduler.start(hour=6, minute=0)
    assert scheduler.is_running
    mock_sched.add_job.assert_called_once()
    mock_sched.start.assert_called_once()

    # Second start is idempotent
    scheduler.start()
    assert mock_sched.start.call_count == 1

    scheduler.shutdown(wait=False)
    assert not scheduler.is_running
    mock_sched.shutdown.assert_called_once_with(wait=False)


@pytest.mark.asyncio
async def test_scheduler_interval_trigger():
    mock_sched = MagicMock(spec=AsyncIOScheduler)
    scheduler = APIxScheduler(scheduler=mock_sched)

    scheduler.start(interval_hours=12)
    assert scheduler.is_running
    job_call = mock_sched.add_job.call_args
    assert job_call is not None
    scheduler.shutdown()


@pytest.mark.asyncio
async def test_scheduled_job_wrapper_catches_exceptions():
    scheduler = APIxScheduler()
    with patch("src.ingestion.scheduler.run_pipeline", side_effect=RuntimeError("Scraper transient error")):
        # Should not raise exception out of wrapper
        await scheduler._scheduled_job_wrapper()


@pytest.mark.asyncio
async def test_scheduler_trigger_now():
    scheduler = APIxScheduler()
    with patch("src.ingestion.scheduler.run_pipeline", new_callable=AsyncMock) as mock_pipeline:
        await scheduler.trigger_now()
        mock_pipeline.assert_awaited_once()
