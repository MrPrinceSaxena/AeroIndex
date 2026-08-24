"""
tests/test_system_health.py

Exercises src/api/system_health.py's compute_overall_status() with plain
dicts -- no database involved.
"""

from datetime import datetime, timedelta, timezone

from src.api.system_health import compute_overall_status

NOW = datetime(2026, 8, 24, 12, 0, 0, tzinfo=timezone.utc)


def run(status: str, hours_ago: int = 1) -> dict:
    return {"status": status, "started_at": NOW - timedelta(hours=hours_ago)}


def freshness(hours_ago: int) -> dict:
    return {"source_name": "air_india_direct", "latest_created_at": NOW - timedelta(hours=hours_ago), "rows": 10}


class TestComputeOverallStatus:
    def test_db_down_overrides_everything(self):
        result = compute_overall_status(
            db_ok=False,
            recent_runs=[run("success")],
            source_freshness=[freshness(1)],
            now=NOW,
        )
        assert result == "down"

    def test_no_runs_ever_is_degraded(self):
        result = compute_overall_status(db_ok=True, recent_runs=[], source_freshness=[freshness(1)], now=NOW)
        assert result == "degraded"

    def test_all_recent_runs_failed_is_degraded(self):
        result = compute_overall_status(
            db_ok=True,
            recent_runs=[run("failed"), run("failed")],
            source_freshness=[freshness(1)],
            now=NOW,
        )
        assert result == "degraded"

    def test_mixed_success_and_failure_is_not_degraded_by_that_alone(self):
        result = compute_overall_status(
            db_ok=True,
            recent_runs=[run("failed"), run("success")],
            source_freshness=[freshness(1)],
            now=NOW,
        )
        assert result == "healthy"

    def test_stale_source_is_degraded(self):
        result = compute_overall_status(
            db_ok=True,
            recent_runs=[run("success")],
            source_freshness=[freshness(72)],  # 72h > 48h default threshold
            now=NOW,
        )
        assert result == "degraded"

    def test_no_source_data_is_degraded(self):
        result = compute_overall_status(db_ok=True, recent_runs=[run("success")], source_freshness=[], now=NOW)
        assert result == "degraded"

    def test_healthy_when_everything_is_fine(self):
        result = compute_overall_status(
            db_ok=True,
            recent_runs=[run("success")],
            source_freshness=[freshness(1)],
            now=NOW,
        )
        assert result == "healthy"

    def test_custom_staleness_threshold(self):
        result = compute_overall_status(
            db_ok=True,
            recent_runs=[run("success")],
            source_freshness=[freshness(10)],
            staleness_hours=5,
            now=NOW,
        )
        assert result == "degraded"
