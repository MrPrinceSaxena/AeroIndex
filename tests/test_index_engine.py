"""
tests/test_index_engine.py

Phase 3 validation -- exercises compute_daily_index / compute_weekly_index
directly with an in-memory DataFrame, no database involved.
"""

from datetime import date

import pandas as pd

from src.index_engine.compute_index import compute_daily_index, compute_weekly_index, BASE_INDEX


def make_df(rows: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(rows)
    df["travel_date"] = pd.to_datetime(df["travel_date"])
    return df


class TestComputeDailyIndex:
    def test_first_date_anchors_at_base(self):
        df = make_df([
            {"travel_date": "2026-08-01", "route": "DEL-BOM", "total_fare": 5800.0, "source_name": "air_india_direct"},
            {"travel_date": "2026-08-01", "route": "DEL-BLR", "total_fare": 5200.0, "source_name": "air_india_direct"},
            {"travel_date": "2026-08-01", "route": "BOM-BLR", "total_fare": 4600.0, "source_name": "air_india_direct"},
        ])
        result = compute_daily_index(df)
        assert result.iloc[0]["apix_value"] == BASE_INDEX

    def test_uniform_price_rise_moves_index_up(self):
        rows = []
        for d, mult in [("2026-08-01", 1.0), ("2026-08-02", 1.10)]:
            for route, fare in [("DEL-BOM", 5800.0), ("DEL-BLR", 5200.0), ("BOM-BLR", 4600.0)]:
                rows.append({
                    "travel_date": d, "route": route,
                    "total_fare": fare * mult, "source_name": "air_india_direct",
                })
        df = make_df(rows)
        result = compute_daily_index(df)
        assert result.iloc[1]["apix_value"] > result.iloc[0]["apix_value"]
        # All routes rose by exactly 10% -> index should rise by ~10% regardless of weights
        assert abs(result.iloc[1]["apix_value"] - BASE_INDEX * 1.10) < 0.5

    def test_flat_prices_hold_index_steady(self):
        rows = []
        for d in ["2026-08-01", "2026-08-02"]:
            for route, fare in [("DEL-BOM", 5800.0), ("DEL-BLR", 5200.0), ("BOM-BLR", 4600.0)]:
                rows.append({
                    "travel_date": d, "route": route,
                    "total_fare": fare, "source_name": "air_india_direct",
                })
        df = make_df(rows)
        result = compute_daily_index(df)
        assert result.iloc[0]["apix_value"] == result.iloc[1]["apix_value"]

    def test_synthetic_data_flags_is_estimated(self):
        df = make_df([
            {"travel_date": "2026-08-01", "route": "DEL-BOM", "total_fare": 5800.0, "source_name": "synthetic_estimate"},
            {"travel_date": "2026-08-01", "route": "DEL-BLR", "total_fare": 5200.0, "source_name": "air_india_direct"},
            {"travel_date": "2026-08-01", "route": "BOM-BLR", "total_fare": 4600.0, "source_name": "indigo_direct"},
        ])
        result = compute_daily_index(df)
        assert result.iloc[0]["is_estimated"]

    def test_all_real_data_not_flagged_estimated(self):
        df = make_df([
            {"travel_date": "2026-08-01", "route": "DEL-BOM", "total_fare": 5800.0, "source_name": "air_india_direct"},
            {"travel_date": "2026-08-01", "route": "DEL-BLR", "total_fare": 5200.0, "source_name": "indigo_direct"},
            {"travel_date": "2026-08-01", "route": "BOM-BLR", "total_fare": 4600.0, "source_name": "air_india_direct"},
        ])
        result = compute_daily_index(df)
        assert not result.iloc[0]["is_estimated"]

    def test_empty_input_returns_empty_df(self):
        df = pd.DataFrame(columns=["travel_date", "route", "total_fare", "source_name"])
        result = compute_daily_index(df)
        assert result.empty


class TestComputeWeeklyIndex:
    def test_empty_daily_returns_empty(self):
        result = compute_weekly_index(pd.DataFrame())
        assert result.empty

    def test_aggregates_multiple_days_into_one_week(self):
        daily = pd.DataFrame([
            {"date": pd.Timestamp("2026-08-03"), "apix_value": 100.0, "is_estimated": False},
            {"date": pd.Timestamp("2026-08-04"), "apix_value": 102.0, "is_estimated": False},
        ])
        result = compute_weekly_index(daily)
        assert len(result) == 1
        assert result.iloc[0]["apix_value"] == 101.0

    def test_any_synthetic_day_flags_week_estimated(self):
        daily = pd.DataFrame([
            {"date": pd.Timestamp("2026-08-03"), "apix_value": 100.0, "is_estimated": False},
            {"date": pd.Timestamp("2026-08-04"), "apix_value": 102.0, "is_estimated": True},
        ])
        result = compute_weekly_index(daily)
        assert result.iloc[0]["is_estimated"]
