"""
tests/test_data_quality.py

Exercises src/api/data_quality.py against small hand-computed DataFrames --
no database involved. Uses the real cleaning functions from
src/cleaning/pipeline.py to build the inputs, matching how the API handler
actually chains them.
"""

from datetime import date

import pandas as pd

from src.api.data_quality import summarize_data_quality, outliers_by_group
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


class TestSummarizeDataQuality:
    def test_empty_input_returns_zeros(self):
        empty = pd.DataFrame(columns=["is_sold_out", "source_name"])
        result = summarize_data_quality(empty, empty, empty, empty)
        assert result["total_rows"] == 0
        assert result["sold_out_pct"] == 0.0
        assert result["rows_per_source"] == []

    def test_counts_sold_out_and_duplicates(self):
        raw = pd.DataFrame([
            make_row(),
            make_row(),  # exact duplicate
            make_row(is_sold_out=True, total_fare=0.0),
        ])
        deduped = deduplicate(raw)
        flagged = flag_outliers(deduped)
        reconciled = reconcile_fare_components(flagged)

        result = summarize_data_quality(raw, deduped, flagged, reconciled)
        assert result["total_rows"] == 3
        assert result["duplicate_rows"] == 1
        assert result["sold_out_pct"] == round(100 / 3, 2)

    def test_rows_per_source(self):
        raw = pd.DataFrame([
            make_row(source_name="air_india_direct"),
            make_row(source_name="indigo_direct"),
            make_row(source_name="indigo_direct"),
        ])
        deduped = deduplicate(raw)
        flagged = flag_outliers(deduped)
        reconciled = reconcile_fare_components(flagged)

        result = summarize_data_quality(raw, deduped, flagged, reconciled)
        counts = {r["source_name"]: r["n_rows"] for r in result["rows_per_source"]}
        assert counts == {"air_india_direct": 1, "indigo_direct": 2}

    def test_outlier_and_mismatch_pct_reflect_real_flags(self):
        rows = [make_row(total_fare=f) for f in [5000, 5200, 5100, 5300, 50000]]
        rows.append(make_row(base_fare=1000.0, taxes=1000.0, total_fare=9000.0))  # mismatch
        raw = pd.DataFrame(rows)
        deduped = deduplicate(raw)
        flagged = flag_outliers(deduped)
        reconciled = reconcile_fare_components(flagged)

        result = summarize_data_quality(raw, deduped, flagged, reconciled)
        assert result["outlier_pct"] > 0
        assert result["component_mismatch_pct"] > 0


class TestOutliersByGroup:
    def test_empty_returns_empty_with_columns(self):
        result = outliers_by_group(pd.DataFrame())
        assert result.empty
        assert list(result.columns) == ["route", "advance_purchase_days", "n_outliers", "n_total", "pct_outliers"]

    def test_aggregates_real_outlier_flags(self):
        rows = [make_row(total_fare=f) for f in [5000, 5200, 5100, 5300, 50000]]
        raw = pd.DataFrame(rows)
        flagged = flag_outliers(raw)

        result = outliers_by_group(flagged)
        assert len(result) == 1
        row = result.iloc[0]
        assert row["route"] == "DEL-BOM"
        assert row["advance_purchase_days"] == 7
        assert row["n_outliers"] == 1
        assert row["n_total"] == 5
        assert row["pct_outliers"] == 20.0
