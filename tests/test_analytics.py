"""
tests/test_analytics.py

Exercises src/api/analytics.py directly against in-memory DataFrames --
no database involved. Same make_df() pattern as tests/test_index_engine.py.
"""

import pandas as pd

from src.api.analytics import (
    compute_route_heatmap,
    compute_elasticity,
    compute_data_coverage,
    generate_summary_sentence,
    compute_route_fare_history,
    compute_route_contributions,
)
from src.index_engine.weights import ROUTE_WEIGHTS


def make_df(rows: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(rows)
    if "travel_date" in df.columns:
        df["travel_date"] = pd.to_datetime(df["travel_date"])
    return df


class TestComputeRouteHeatmap:
    def test_real_data_produces_median_fares(self):
        df = make_df([
            {"route": "DEL-BOM", "advance_purchase_days": 7, "total_fare": 5000.0, "source_name": "air_india_direct"},
            {"route": "DEL-BOM", "advance_purchase_days": 7, "total_fare": 6000.0, "source_name": "indigo_direct"},
        ])
        result = compute_route_heatmap(df)
        assert len(result) == 1
        assert result.iloc[0]["median_fare"] == 5500.0

    def test_synthetic_only_returns_empty(self):
        df = make_df([
            {"route": "DEL-BOM", "advance_purchase_days": 7, "total_fare": 5800.0, "source_name": "synthetic_estimate"},
        ])
        result = compute_route_heatmap(df)
        assert result.empty
        assert list(result.columns) == ["route", "advance_purchase_days", "median_fare"]

    def test_synthetic_excluded_from_mixed_data(self):
        df = make_df([
            {"route": "DEL-BOM", "advance_purchase_days": 7, "total_fare": 5000.0, "source_name": "air_india_direct"},
            {"route": "DEL-BOM", "advance_purchase_days": 7, "total_fare": 99999.0, "source_name": "synthetic_estimate"},
        ])
        result = compute_route_heatmap(df)
        assert result.iloc[0]["median_fare"] == 5000.0


class TestComputeElasticity:
    def test_filters_to_requested_route(self):
        df = make_df([
            {"route": "DEL-BOM", "advance_purchase_days": 7, "total_fare": 5000.0, "source_name": "air_india_direct"},
            {"route": "DEL-BLR", "advance_purchase_days": 7, "total_fare": 4000.0, "source_name": "air_india_direct"},
        ])
        result = compute_elasticity(df, "DEL-BOM")
        assert len(result) == 1
        assert result.iloc[0]["median_fare"] == 5000.0

    def test_separate_rows_per_source(self):
        df = make_df([
            {"route": "DEL-BOM", "advance_purchase_days": 7, "total_fare": 5000.0, "source_name": "air_india_direct"},
            {"route": "DEL-BOM", "advance_purchase_days": 7, "total_fare": 5500.0, "source_name": "indigo_direct"},
        ])
        result = compute_elasticity(df, "DEL-BOM")
        assert len(result) == 2
        assert set(result["source_name"]) == {"air_india_direct", "indigo_direct"}

    def test_no_match_returns_empty(self):
        df = make_df([
            {"route": "DEL-BLR", "advance_purchase_days": 7, "total_fare": 4000.0, "source_name": "air_india_direct"},
        ])
        result = compute_elasticity(df, "DEL-BOM")
        assert result.empty
        assert list(result.columns) == ["advance_purchase_days", "source_name", "median_fare"]


class TestComputeDataCoverage:
    def test_counts_real_and_synthetic(self):
        df = make_df([
            {"source_name": "air_india_direct"},
            {"source_name": "indigo_direct"},
            {"source_name": "synthetic_estimate"},
        ])
        result = compute_data_coverage(df)
        assert result == {"n_real": 2, "n_synthetic": 1}

    def test_all_synthetic(self):
        df = make_df([{"source_name": "synthetic_estimate"}] * 3)
        result = compute_data_coverage(df)
        assert result == {"n_real": 0, "n_synthetic": 3}


class TestGenerateSummarySentence:
    def test_insufficient_data_under_two_days(self):
        daily_df = pd.DataFrame([{"date": pd.Timestamp("2026-08-01"), "apix_value": 100.0}])
        result = generate_summary_sentence(daily_df, pd.DataFrame())
        assert result["has_sufficient_data"] is False
        assert result["summary"] == "Not enough data for a trend statement yet."

    def test_empty_daily_df(self):
        result = generate_summary_sentence(pd.DataFrame(), pd.DataFrame())
        assert result["has_sufficient_data"] is False

    def test_rise_reports_upward_direction(self):
        daily_df = pd.DataFrame([
            {"date": pd.Timestamp("2026-08-01"), "apix_value": 100.0},
            {"date": pd.Timestamp("2026-08-02"), "apix_value": 110.0},
        ])
        raw_df = make_df([
            {"travel_date": "2026-08-01", "route": "DEL-BOM", "total_fare": 5000.0, "source_name": "air_india_direct"},
            {"travel_date": "2026-08-02", "route": "DEL-BOM", "total_fare": 5500.0, "source_name": "air_india_direct"},
        ])
        result = generate_summary_sentence(daily_df, raw_df)
        assert result["has_sufficient_data"] is True
        assert "rose" in result["summary"]
        assert "DEL-BOM" in result["summary"]

    def test_fall_reports_downward_direction(self):
        daily_df = pd.DataFrame([
            {"date": pd.Timestamp("2026-08-01"), "apix_value": 110.0},
            {"date": pd.Timestamp("2026-08-02"), "apix_value": 100.0},
        ])
        raw_df = make_df([
            {"travel_date": "2026-08-01", "route": "DEL-BOM", "total_fare": 5500.0, "source_name": "air_india_direct"},
            {"travel_date": "2026-08-02", "route": "DEL-BOM", "total_fare": 5000.0, "source_name": "air_india_direct"},
        ])
        result = generate_summary_sentence(daily_df, raw_df)
        assert "fell" in result["summary"]

    def test_no_route_overlap_falls_back_to_generic_sentence(self):
        """Matches the original Streamlit fallback: no direction word when
        there isn't enough route-level data to attribute the move."""
        daily_df = pd.DataFrame([
            {"date": pd.Timestamp("2026-08-01"), "apix_value": 110.0},
            {"date": pd.Timestamp("2026-08-02"), "apix_value": 100.0},
        ])
        result = generate_summary_sentence(daily_df, pd.DataFrame())
        assert result["has_sufficient_data"] is True
        assert "moved by" in result["summary"]


class TestComputeRouteFareHistory:
    def test_filters_and_orders_by_date(self):
        df = make_df([
            {"travel_date": "2026-08-01", "route": "DEL-BOM", "total_fare": 5000.0, "source_name": "air_india_direct"},
            {"travel_date": "2026-08-02", "route": "DEL-BOM", "total_fare": 5200.0, "source_name": "air_india_direct"},
            {"travel_date": "2026-08-01", "route": "DEL-BLR", "total_fare": 4000.0, "source_name": "air_india_direct"},
        ])
        result = compute_route_fare_history(df, "DEL-BOM")
        assert len(result) == 2
        assert list(result["median_fare"]) == [5000.0, 5200.0]

    def test_marks_estimated_when_only_synthetic(self):
        df = make_df([
            {"travel_date": "2026-08-01", "route": "DEL-BOM", "total_fare": 5000.0, "source_name": "synthetic_estimate"},
        ])
        result = compute_route_fare_history(df, "DEL-BOM")
        assert result.iloc[0]["is_estimated"]

    def test_not_estimated_when_any_real_present(self):
        df = make_df([
            {"travel_date": "2026-08-01", "route": "DEL-BOM", "total_fare": 5000.0, "source_name": "air_india_direct"},
            {"travel_date": "2026-08-01", "route": "DEL-BOM", "total_fare": 5100.0, "source_name": "synthetic_estimate"},
        ])
        result = compute_route_fare_history(df, "DEL-BOM")
        assert not result.iloc[0]["is_estimated"]

    def test_no_match_returns_empty_with_columns(self):
        df = make_df([
            {"travel_date": "2026-08-01", "route": "DEL-BLR", "total_fare": 4000.0, "source_name": "air_india_direct"},
        ])
        result = compute_route_fare_history(df, "DEL-BOM")
        assert result.empty
        assert list(result.columns) == ["travel_date", "median_fare", "is_estimated"]


class TestComputeRouteContributions:
    def test_insufficient_data_under_two_dates(self):
        daily_df = pd.DataFrame([
            {"date": pd.Timestamp("2026-08-01"), "apix_value": 100.0, "per_route_fares": {"DEL-BOM": 5800.0}},
        ])
        result = compute_route_contributions(daily_df)
        assert result["has_sufficient_data"] is False
        assert result["contributions"] == []

    def test_contributions_sum_to_total_log_change(self):
        daily_df = pd.DataFrame([
            {
                "date": pd.Timestamp("2026-08-01"), "apix_value": 100.0,
                "per_route_fares": {"DEL-BOM": 5800.0, "DEL-BLR": 5200.0, "BOM-BLR": 4600.0},
            },
            {
                "date": pd.Timestamp("2026-08-02"), "apix_value": 103.0,
                "per_route_fares": {"DEL-BOM": 6000.0, "DEL-BLR": 5200.0, "BOM-BLR": 4600.0},
            },
        ])
        result = compute_route_contributions(daily_df)
        assert result["has_sufficient_data"] is True
        assert len(result["contributions"]) == len(ROUTE_WEIGHTS)

        summed = sum(c["contribution"] for c in result["contributions"] if c["contribution"] is not None)
        # total_log_change is intentionally rounded to 4dp by the function
        assert abs(summed - result["total_log_change"]) < 1e-3

        # DEL-BOM rose, the others held flat -- only DEL-BOM should contribute
        del_bom = next(c for c in result["contributions"] if c["route"] == "DEL-BOM")
        del_blr = next(c for c in result["contributions"] if c["route"] == "DEL-BLR")
        assert del_bom["contribution"] > 0
        assert del_blr["contribution"] == 0.0

    def test_missing_route_fare_yields_none_contribution(self):
        daily_df = pd.DataFrame([
            {"date": pd.Timestamp("2026-08-01"), "apix_value": 100.0, "per_route_fares": {"DEL-BOM": 5800.0}},
            {"date": pd.Timestamp("2026-08-02"), "apix_value": 100.0, "per_route_fares": {"DEL-BOM": 5800.0}},
        ])
        result = compute_route_contributions(daily_df)
        del_blr = next(c for c in result["contributions"] if c["route"] == "DEL-BLR")
        assert del_blr["contribution"] is None
