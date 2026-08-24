"""
tests/test_backtest.py

src/backtest/compare_dgca.py had zero test coverage before this. Exercises
compare() and describe_comparison() against in-memory DataFrames -- no
database involved.
"""

import pandas as pd

from src.backtest.compare_dgca import compare, describe_comparison, DGCA_REFERENCE


def make_daily_df(rows: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(rows)


class TestCompare:
    def test_empty_input_returns_empty(self):
        result = compare(pd.DataFrame())
        assert result.empty

    def test_no_overlapping_month_returns_empty(self):
        # DGCA_REFERENCE only covers 2023-04..2023-06 -- 2026 data never overlaps.
        daily_df = make_daily_df([
            {"date": pd.Timestamp("2026-08-01"), "apix_value": 100.0,
             "per_route_fares": {"DEL-BOM": 5800.0, "DEL-BLR": 5200.0, "BOM-BLR": 4600.0}},
        ])
        result = compare(daily_df)
        assert result.empty

    def test_overlapping_month_computes_deviation(self):
        daily_df = make_daily_df([
            {"date": pd.Timestamp("2023-04-15"), "apix_value": 100.0,
             "per_route_fares": {"DEL-BOM": 5650.0, "DEL-BLR": 5100.0, "BOM-BLR": 4500.0}},
        ])
        result = compare(daily_df)
        assert len(result) == 3
        # Exact match to DGCA reference -> 0% deviation, never flagged
        assert (result["deviation_pct"] == 0.0).all()
        assert not result["deviation_flagged"].any()

    def test_large_deviation_is_flagged(self):
        daily_df = make_daily_df([
            {"date": pd.Timestamp("2023-04-15"), "apix_value": 100.0,
             "per_route_fares": {"DEL-BOM": 20000.0, "DEL-BLR": 5100.0, "BOM-BLR": 4500.0}},
        ])
        result = compare(daily_df)
        del_bom_row = result[result["route"] == "DEL-BOM"].iloc[0]
        assert del_bom_row["deviation_flagged"]


class TestDescribeComparison:
    def test_no_overlap_reports_both_periods_honestly(self):
        daily_df = make_daily_df([
            {"date": pd.Timestamp("2026-08-01"), "apix_value": 100.0,
             "per_route_fares": {"DEL-BOM": 5800.0}},
        ])
        comparison_df = compare(daily_df)
        result = describe_comparison(daily_df, comparison_df)

        assert result["has_overlap"] is False
        assert result["live_data_period"] == "2026-08-01 to 2026-08-01"
        assert "2023-04" in result["reference_period"]
        assert len(result["reference_data"]) == len(DGCA_REFERENCE)

    def test_overlap_reports_true(self):
        daily_df = make_daily_df([
            {"date": pd.Timestamp("2023-04-15"), "apix_value": 100.0,
             "per_route_fares": {"DEL-BOM": 5650.0}},
        ])
        comparison_df = compare(daily_df)
        result = describe_comparison(daily_df, comparison_df)
        assert result["has_overlap"] is True

    def test_empty_daily_df_reports_no_live_period(self):
        result = describe_comparison(pd.DataFrame(), pd.DataFrame())
        assert result["live_data_period"] is None
        assert result["has_overlap"] is False
