"""
Tests for provenance_guard: assert_observed_only, assert_query_is_quarantined,
and Coverage.

These are unit tests of the guard in isolation. The end-to-end test (insert
imputed → run compute_daily_index → assert CircularValidationError) belongs
in test_circularity_integration.py and is added in Step 3 when the index
engine is wired to the quarantined view.
"""

from datetime import date

import pytest

from src.validation.provenance_guard import (
    CircularValidationError,
    Coverage,
    assert_observed_only,
    assert_query_is_quarantined,
    PUBLISHED_SOURCE_VIEW,
)


class TestAssertObservedOnly:
    def test_all_observed_passes(self):
        rows = [
            {"data_origin": "observed", "total_fare": 5000},
            {"data_origin": "observed", "total_fare": 6000},
        ]
        # Should not raise
        assert_observed_only(rows, "test_context")

    def test_imputed_row_raises(self):
        rows = [
            {"data_origin": "observed", "total_fare": 5000},
            {"data_origin": "imputed", "total_fare": 4500},
        ]
        with pytest.raises(CircularValidationError) as exc_info:
            assert_observed_only(rows, "test_index")
        assert "1 non-observed rows" in str(exc_info.value)
        assert "test_index" in str(exc_info.value)
        assert PUBLISHED_SOURCE_VIEW in str(exc_info.value)

    def test_multiple_imputed_rows_counted(self):
        rows = [
            {"data_origin": "imputed"},
            {"data_origin": "imputed"},
            {"data_origin": "observed"},
        ]
        with pytest.raises(CircularValidationError) as exc_info:
            assert_observed_only(rows, "backtest")
        assert "2 non-observed rows" in str(exc_info.value)

    def test_none_origin_raises(self):
        rows = [{"data_origin": None}]
        with pytest.raises(CircularValidationError):
            assert_observed_only(rows, "test")

    def test_missing_key_raises(self):
        rows = [{"total_fare": 5000}]  # no data_origin key
        with pytest.raises(CircularValidationError):
            assert_observed_only(rows, "test")

    def test_empty_iterable_passes(self):
        assert_observed_only([], "empty_context")

    def test_works_with_object_attributes(self):
        class Row:
            def __init__(self, origin):
                self.data_origin = origin

        rows = [Row("observed")]
        assert_observed_only(rows, "attr_test")

        rows_bad = [Row("imputed")]
        with pytest.raises(CircularValidationError):
            assert_observed_only(rows_bad, "attr_test")


class TestAssertQueryIsQuarantined:
    def test_query_using_view_passes(self):
        sql = f"SELECT * FROM {PUBLISHED_SOURCE_VIEW} WHERE route = 'DEL-BOM'"
        assert_query_is_quarantined(sql, "test_query")

    def test_query_using_raw_table_raises(self):
        sql = "SELECT * FROM fare_quotes WHERE route = 'DEL-BOM'"
        with pytest.raises(CircularValidationError) as exc_info:
            assert_query_is_quarantined(sql, "index_query")
        assert "fare_quotes" in str(exc_info.value)
        assert PUBLISHED_SOURCE_VIEW in str(exc_info.value)

    def test_raw_table_with_observed_filter_passes(self):
        sql = "SELECT * FROM fare_quotes WHERE data_origin = 'observed' AND route = 'DEL-BOM'"
        assert_query_is_quarantined(sql, "filtered_query")

    def test_case_insensitive(self):
        sql = "SELECT * FROM FARE_QUOTES WHERE route = 'DEL-BOM'"
        with pytest.raises(CircularValidationError):
            assert_query_is_quarantined(sql, "upper_case")

    def test_unrelated_table_passes(self):
        sql = "SELECT * FROM route_basket WHERE is_active"
        assert_query_is_quarantined(sql, "other_table")


class TestCoverage:
    def test_full_coverage_is_publishable(self):
        cov = Coverage(
            as_of=date(2026, 9, 8),
            cells_expected=30,
            cells_observed=30,
            quotes_observed=150,
            sources_live=["api:duffel"],
        )
        assert cov.completeness == 1.0
        assert cov.is_publishable is True

    def test_partial_coverage_below_threshold(self):
        cov = Coverage(
            as_of=date(2026, 9, 8),
            cells_expected=30,
            cells_observed=10,
            quotes_observed=50,
            sources_live=["api:duffel"],
        )
        assert cov.completeness == pytest.approx(10 / 30)
        assert cov.is_publishable is False

    def test_exactly_at_threshold(self):
        cov = Coverage(
            as_of=date(2026, 9, 8),
            cells_expected=10,
            cells_observed=6,
            quotes_observed=30,
            sources_live=["api:duffel"],
        )
        assert cov.completeness == 0.6
        assert cov.is_publishable is True

    def test_zero_expected_cells(self):
        cov = Coverage(
            as_of=date(2026, 9, 8),
            cells_expected=0,
            cells_observed=0,
            quotes_observed=0,
            sources_live=[],
        )
        assert cov.completeness == 0.0
        assert cov.is_publishable is False

    def test_api_block_structure(self):
        cov = Coverage(
            as_of=date(2026, 9, 8),
            cells_expected=15,
            cells_observed=9,
            quotes_observed=45,
            sources_live=["api:duffel", "air_india_direct"],
        )
        block = cov.as_api_block()
        assert block["as_of"] == "2026-09-08"
        assert block["cells_expected"] == 15
        assert block["cells_observed"] == 9
        assert block["quotes_observed"] == 45
        assert block["completeness"] == 0.6
        assert block["publishable"] is True
        assert "observed fares only" in block["basis"]
        assert set(block["sources_live"]) == {"api:duffel", "air_india_direct"}
