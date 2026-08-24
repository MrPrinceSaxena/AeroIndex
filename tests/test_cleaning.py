"""
tests/test_cleaning.py

Phase 2 validation -- these exercise the pure pandas logic in
src/cleaning/pipeline.py directly, with no database involved.
"""

from datetime import date

import pandas as pd

from src.cleaning.pipeline import deduplicate, flag_outliers, reconcile_fare_components


def make_row(**overrides) -> dict:
    row = {
        "route": "DEL-BOM",
        "carrier": "Air India",
        "date_scraped": date(2026, 8, 1),
        "travel_date": date(2026, 8, 8),
        "advance_purchase_days": 7,
        "fare_class": "Economy",
        "base_fare": 4200.0,
        "taxes": 1600.0,
        "total_fare": 5800.0,
        "source_name": "air_india_direct",
        "is_sold_out": False,
    }
    row.update(overrides)
    return row


class TestDeduplicate:
    def test_removes_exact_duplicates(self):
        df = pd.DataFrame([make_row(), make_row()])
        result = deduplicate(df)
        assert len(result) == 1

    def test_keeps_distinct_sources(self):
        df = pd.DataFrame([make_row(), make_row(source_name="indigo_direct")])
        result = deduplicate(df)
        assert len(result) == 2

    def test_source_name_survives(self):
        df = pd.DataFrame([make_row(), make_row(source_name="indigo_direct")])
        result = deduplicate(df)
        assert result["source_name"].isna().sum() == 0


class TestFlagOutliers:
    def test_flags_extreme_value(self):
        rows = [make_row(total_fare=f) for f in [5000, 5200, 5100, 5300, 50000]]
        df = pd.DataFrame(rows)
        result = flag_outliers(df)
        assert result["is_outlier"].sum() == 1
        assert result.loc[result["total_fare"] == 50000, "is_outlier"].iloc[0]

    def test_no_outliers_in_tight_cluster(self):
        rows = [make_row(total_fare=f) for f in [5000, 5050, 5100, 5150, 5200]]
        df = pd.DataFrame(rows)
        result = flag_outliers(df)
        assert result["is_outlier"].sum() == 0

    def test_skips_small_groups(self):
        # Fewer than 4 rows in a route/window group -- not enough for a stable IQR
        rows = [make_row(total_fare=f) for f in [5000, 999999]]
        df = pd.DataFrame(rows)
        result = flag_outliers(df)
        assert result["is_outlier"].sum() == 0

    def test_outliers_not_dropped(self):
        rows = [make_row(total_fare=f) for f in [5000, 5200, 5100, 5300, 50000]]
        df = pd.DataFrame(rows)
        result = flag_outliers(df)
        assert len(result) == len(rows)  # flagged, never removed


class TestReconcileFareComponents:
    def test_matching_components_not_flagged(self):
        df = pd.DataFrame([make_row(base_fare=4200.0, taxes=1600.0, total_fare=5800.0)])
        result = reconcile_fare_components(df)
        assert not result["component_mismatch"].iloc[0]

    def test_mismatched_components_flagged(self):
        df = pd.DataFrame([make_row(base_fare=4200.0, taxes=1600.0, total_fare=9000.0)])
        result = reconcile_fare_components(df)
        assert result["component_mismatch"].iloc[0]

    def test_within_tolerance_not_flagged(self):
        df = pd.DataFrame([make_row(base_fare=4200.0, taxes=1600.0, total_fare=5830.0)])
        result = reconcile_fare_components(df, tolerance=50.0)
        assert not result["component_mismatch"].iloc[0]

    def test_missing_components_skipped_not_flagged(self):
        df = pd.DataFrame([make_row(base_fare=None, taxes=None, total_fare=5800.0)])
        result = reconcile_fare_components(df)
        assert not result["component_mismatch"].iloc[0]
