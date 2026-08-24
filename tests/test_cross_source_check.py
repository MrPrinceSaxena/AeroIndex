"""
tests/test_cross_source_check.py

Phase 1c validation -- exercises compute_cross_source_differences directly
with an in-memory DataFrame, no database involved.
"""

import pandas as pd

from src.validation.cross_source_check import compute_cross_source_differences


def make_df(rows: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(rows)


class TestComputeCrossSourceDifferences:
    def test_computes_pct_difference_for_overlap(self):
        df = make_df([
            {"route": "DEL-BOM", "travel_date": "2026-08-08", "advance_purchase_days": 7,
             "total_fare": 5000.0, "source_name": "air_india_direct"},
            {"route": "DEL-BOM", "travel_date": "2026-08-08", "advance_purchase_days": 7,
             "total_fare": 5500.0, "source_name": "indigo_direct"},
        ])
        result = compute_cross_source_differences(df)
        assert len(result) == 1
        assert result.iloc[0]["pct_difference"] == 10.0

    def test_no_overlap_returns_empty(self):
        df = make_df([
            {"route": "DEL-BOM", "travel_date": "2026-08-08", "advance_purchase_days": 7,
             "total_fare": 5000.0, "source_name": "air_india_direct"},
            {"route": "DEL-BLR", "travel_date": "2026-08-08", "advance_purchase_days": 7,
             "total_fare": 5200.0, "source_name": "indigo_direct"},
        ])
        result = compute_cross_source_differences(df)
        assert result.empty

    def test_synthetic_data_excluded(self):
        df = make_df([
            {"route": "DEL-BOM", "travel_date": "2026-08-08", "advance_purchase_days": 7,
             "total_fare": 5000.0, "source_name": "air_india_direct"},
            {"route": "DEL-BOM", "travel_date": "2026-08-08", "advance_purchase_days": 7,
             "total_fare": 5500.0, "source_name": "synthetic_estimate"},
        ])
        result = compute_cross_source_differences(df)
        assert result.empty

    def test_pct_difference_always_positive(self):
        df = make_df([
            {"route": "DEL-BOM", "travel_date": "2026-08-08", "advance_purchase_days": 7,
             "total_fare": 5500.0, "source_name": "air_india_direct"},
            {"route": "DEL-BOM", "travel_date": "2026-08-08", "advance_purchase_days": 7,
             "total_fare": 5000.0, "source_name": "indigo_direct"},
        ])
        result = compute_cross_source_differences(df)
        assert result.iloc[0]["pct_difference"] > 0

    def test_no_records_for_configured_sources_returns_empty(self):
        # Realistic "no overlap" shape: columns present (as run_all.py always
        # constructs them from FareRecord.__dict__), just no matching rows.
        df = make_df([
            {"route": "DEL-BOM", "travel_date": "2026-08-08", "advance_purchase_days": 7,
             "total_fare": 5000.0, "source_name": "air_india_direct"},
        ])
        result = compute_cross_source_differences(df)
        assert result.empty
        assert "pct_difference" in result.columns
