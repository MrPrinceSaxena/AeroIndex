"""
src/api/system_health.py

Pure logic backing GET /system/health. No DB access here -- takes the outputs
of src/ingestion/run_log.py's loaders and derives one overall status from
them. Unit-tested with plain dicts in tests/test_system_health.py.
"""

from datetime import datetime, timezone
from typing import Literal, Optional

Status = Literal["healthy", "degraded", "down"]


def compute_overall_status(
    db_ok: bool,
    recent_runs: list[dict],
    source_freshness: list[dict],
    staleness_hours: int = 48,
    now: Optional[datetime] = None,
) -> Status:
    """
    healthy   -- DB reachable, at least one recent run succeeded, no source
                 is stale past the threshold.
    degraded  -- DB reachable but something is off: no runs ever, every
                 recent run failed, or a source hasn't been refreshed
                 recently.
    down      -- DB unreachable. Nothing else matters if we can't even read
                 the tables.
    """
    if not db_ok:
        return "down"

    if not recent_runs:
        return "degraded"

    if all(run.get("status") == "failed" for run in recent_runs):
        return "degraded"

    if not source_freshness:
        return "degraded"

    now = now or datetime.now(timezone.utc)
    for source in source_freshness:
        latest = source.get("latest_created_at")
        if latest is None:
            return "degraded"
        if latest.tzinfo is None:
            latest = latest.replace(tzinfo=timezone.utc)
        age_hours = (now - latest).total_seconds() / 3600
        if age_hours > staleness_hours:
            return "degraded"

    return "healthy"
