"""
Circularity integration tests — scoped to the view and the guard.

Step 1 scope:
    1. An imputed row must be rejected by assert_observed_only().
    2. A query against fare_quotes without observed filter must be rejected
       by assert_query_is_quarantined().
    3. An imputed FareRecord constructed via the old dataclass is caught
       when its dict representation is checked.

Step 3 scope (added later when compute_index.py is wired to the view):
    4. Insert imputed row → run compute_daily_index() → assert
       CircularValidationError.
    This end-to-end test is the artifact shown to a judge who asks how you
    know the number is real.
"""

import pytest

from src.validation.provenance_guard import (
    CircularValidationError,
    assert_observed_only,
    assert_query_is_quarantined,
    PUBLISHED_SOURCE_VIEW,
)


class TestCircularityGuardIntegration:
    """
    Prove that imputed data is structurally excluded from index paths.
    """

    def test_imputed_row_rejected_by_guard(self):
        """
        The fundamental test: a row tagged data_origin='imputed' must not
        survive assert_observed_only(). This is the belt-and-braces check
        that backs the SQL view quarantine.
        """
        imputed_row = {
            "id": "fake-uuid",
            "route": "DEL-BOM",
            "travel_date": "2026-09-15",
            "advance_purchase_days": 7,
            "total_fare": 5800.00,
            "source_name": "synthetic_estimate",
            "data_origin": "imputed",
            "is_sold_out": False,
        }
        with pytest.raises(CircularValidationError) as exc_info:
            assert_observed_only([imputed_row], "compute_daily_index")
        assert "1 non-observed rows" in str(exc_info.value)
        assert "compute_daily_index" in str(exc_info.value)

    def test_observed_row_passes_guard(self):
        """Observed rows must pass the guard without exception."""
        observed_row = {
            "id": "real-uuid",
            "route": "DEL-BOM",
            "travel_date": "2026-09-15",
            "advance_purchase_days": 7,
            "total_fare": 5200.00,
            "source_name": "api:duffel",
            "data_origin": "observed",
            "is_sold_out": False,
        }
        # Must not raise
        assert_observed_only([observed_row], "compute_daily_index")

    def test_mixed_batch_rejected(self):
        """
        A batch mixing observed and imputed rows must be rejected entirely.
        The index must never silently blend both.
        """
        rows = [
            {"data_origin": "observed", "route": "DEL-BOM", "total_fare": 5200},
            {"data_origin": "imputed", "route": "DEL-BLR", "total_fare": 4800},
            {"data_origin": "imputed", "route": "BOM-BLR", "total_fare": 4200},
        ]
        with pytest.raises(CircularValidationError) as exc_info:
            assert_observed_only(rows, "backtest")
        assert "2 non-observed rows" in str(exc_info.value)

    def test_direct_table_query_rejected(self):
        """
        Any SQL query that reads fare_quotes without an observed-only filter
        must be caught by the static query check.
        """
        bad_sql = """
            SELECT route, travel_date, total_fare
            FROM fare_quotes
            WHERE is_sold_out = FALSE
            ORDER BY travel_date
        """
        with pytest.raises(CircularValidationError) as exc_info:
            assert_query_is_quarantined(bad_sql, "load_clean_fares")
        assert "fare_quotes" in str(exc_info.value)

    def test_quarantined_view_query_passes(self):
        """Queries against the quarantine view must pass."""
        good_sql = f"""
            SELECT route, travel_date, total_fare
            FROM {PUBLISHED_SOURCE_VIEW}
            WHERE is_sold_out = FALSE
            ORDER BY travel_date
        """
        # Must not raise
        assert_query_is_quarantined(good_sql, "load_clean_fares")

    def test_filtered_raw_table_query_passes(self):
        """
        A query against fare_quotes with an explicit observed filter is
        acceptable (though the view is preferred).
        """
        filtered_sql = """
            SELECT * FROM fare_quotes
            WHERE data_origin = 'observed' AND route = 'DEL-BOM'
        """
        assert_query_is_quarantined(filtered_sql, "alternative_path")
