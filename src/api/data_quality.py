"""
src/api/data_quality.py

Pure aggregation over the outputs of the REAL cleaning functions in
src/cleaning/pipeline.py (deduplicate, flag_outliers, reconcile_fare_components)
-- this module never reimplements cleaning logic, it only summarizes what
those functions already computed, for GET /apix/data-quality.
"""

import pandas as pd


def summarize_data_quality(
    raw_df: pd.DataFrame,
    deduped_df: pd.DataFrame,
    flagged_df: pd.DataFrame,
    reconciled_df: pd.DataFrame,
) -> dict:
    """
    Headline data-quality numbers. All percentages are of raw_df's row count
    (0 if raw_df is empty, never a division error).
    """
    total_rows = len(raw_df)
    if total_rows == 0:
        return {
            "total_rows": 0,
            "sold_out_pct": 0.0,
            "duplicate_rows": 0,
            "outlier_pct": 0.0,
            "component_mismatch_pct": 0.0,
            "rows_per_source": [],
        }

    sold_out_pct = round(100 * raw_df["is_sold_out"].sum() / total_rows, 2)
    duplicate_rows = int(total_rows - len(deduped_df))
    outlier_pct = round(100 * flagged_df["is_outlier"].sum() / len(flagged_df), 2) if len(flagged_df) else 0.0
    mismatch_pct = (
        round(100 * reconciled_df["component_mismatch"].sum() / len(reconciled_df), 2)
        if len(reconciled_df)
        else 0.0
    )

    rows_per_source = [
        {"source_name": name, "n_rows": int(count)}
        for name, count in raw_df["source_name"].value_counts().items()
    ]

    return {
        "total_rows": total_rows,
        "sold_out_pct": sold_out_pct,
        "duplicate_rows": duplicate_rows,
        "outlier_pct": outlier_pct,
        "component_mismatch_pct": mismatch_pct,
        "rows_per_source": rows_per_source,
    }


def outliers_by_group(flagged_df: pd.DataFrame) -> pd.DataFrame:
    """
    Per route+advance-window breakdown of the is_outlier column that
    flag_outliers() already produced -- an aggregation, not a re-detection.
    """
    if flagged_df.empty or "is_outlier" not in flagged_df.columns:
        return pd.DataFrame(columns=["route", "advance_purchase_days", "n_outliers", "n_total", "pct_outliers"])

    grouped = (
        flagged_df.groupby(["route", "advance_purchase_days"])
        .agg(n_outliers=("is_outlier", "sum"), n_total=("is_outlier", "count"))
        .reset_index()
    )
    grouped["n_outliers"] = grouped["n_outliers"].astype(int)
    grouped["pct_outliers"] = (100 * grouped["n_outliers"] / grouped["n_total"]).round(2)
    return grouped
