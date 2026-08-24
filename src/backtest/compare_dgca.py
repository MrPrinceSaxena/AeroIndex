"""
src/backtest/compare_dgca.py

Phase 4 — Backtest against DGCA published average fares.

Compares the monthly average of our APIx index against DGCA's published
average fares for the same routes.

DGCA reference data:
    Source: DGCA Traffic and Fare Monitor (monthly PDF reports)
    Ministry of Civil Aviation, India
    https://dgca.gov.in/digigov-portal/StatsDashBoard

    Using FY2023-24 published monthly average one-way economy fares (INR):
    These numbers are from the DGCA Fare Monitoring quarterly reports.
    A deviation flag is raised when our index deviates > 15% from DGCA reference --
    that threshold is a data-quality signal, not a failure. Show it, don't hide it.
"""

import pandas as pd
import numpy as np

# DGCA published monthly average fares (INR, one-way economy, FY2023-24)
# Source: DGCA Traffic and Fare Monitor — Ministry of Civil Aviation
# Approximate monthly values — update with exact figures from the report PDFs
DGCA_REFERENCE = pd.DataFrame([
    {"month": "2023-04", "route": "DEL-BOM", "dgca_avg_fare": 5650},
    {"month": "2023-04", "route": "DEL-BLR", "dgca_avg_fare": 5100},
    {"month": "2023-04", "route": "BOM-BLR", "dgca_avg_fare": 4500},
    {"month": "2023-05", "route": "DEL-BOM", "dgca_avg_fare": 5900},
    {"month": "2023-05", "route": "DEL-BLR", "dgca_avg_fare": 5300},
    {"month": "2023-05", "route": "BOM-BLR", "dgca_avg_fare": 4700},
    {"month": "2023-06", "route": "DEL-BOM", "dgca_avg_fare": 6100},
    {"month": "2023-06", "route": "DEL-BLR", "dgca_avg_fare": 5500},
    {"month": "2023-06", "route": "BOM-BLR", "dgca_avg_fare": 4900},
    # TODO: extend with actual DGCA report values for remaining months
])

DEVIATION_THRESHOLD_PCT = 15.0  # flag if our index deviates > 15% from DGCA


def compare(apix_daily_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compare our index's implied fare levels against DGCA reference.

    Args:
        apix_daily_df: Output of compute_daily_index() — has 'date' and
                       'per_route_fares' columns

    Returns:
        DataFrame with deviation metrics per route per month.
        Large deviations (> DEVIATION_THRESHOLD_PCT) are flagged — show these
        in the pitch deck as a data-quality signal, not hidden.
    """
    if apix_daily_df.empty:
        print("No index data to compare against DGCA reference.")
        return pd.DataFrame()

    # Extract per-route fares from the daily index
    route_rows = []
    for _, row in apix_daily_df.iterrows():
        for route, fare in row.get("per_route_fares", {}).items():
            route_rows.append({"date": row["date"], "route": route, "apix_fare": fare})

    if not route_rows:
        return pd.DataFrame()

    apix_df = pd.DataFrame(route_rows)
    apix_df["date"] = pd.to_datetime(apix_df["date"])
    apix_df["month"] = apix_df["date"].dt.to_period("M").astype(str)

    monthly_apix = (
        apix_df.groupby(["month", "route"])
        .agg(apix_avg=("apix_fare", "mean"))
        .reset_index()
    )

    merged = pd.merge(monthly_apix, DGCA_REFERENCE, on=["month", "route"], how="inner")
    if merged.empty:
        print("No overlapping months between APIx data and DGCA reference — "
              "check that travel_date range matches DGCA report period.")
        return pd.DataFrame()

    merged["deviation_pct"] = (
        (merged["apix_avg"] - merged["dgca_avg_fare"]).abs() / merged["dgca_avg_fare"] * 100
    ).round(2)
    merged["deviation_flagged"] = merged["deviation_pct"] > DEVIATION_THRESHOLD_PCT

    n_flagged = merged["deviation_flagged"].sum()
    if n_flagged:
        print(f"BACKTEST: {n_flagged} route-months deviate > {DEVIATION_THRESHOLD_PCT}% "
              f"from DGCA reference — review these in the deck as data-quality signals:")
        print(merged[merged["deviation_flagged"]].to_string(index=False))
    else:
        print(f"BACKTEST: All route-months within {DEVIATION_THRESHOLD_PCT}% of DGCA reference.")

    return merged


def describe_comparison(apix_daily_df: pd.DataFrame, comparison_df: pd.DataFrame) -> dict:
    """
    Frames compare()'s output for the API/UI layer: whether any overlap
    exists, and what period each side actually covers. This is what lets the
    DGCA Benchmarking page give an honest explanation instead of a blank
    chart when live data and the reference months don't overlap yet -- a
    near-certain state right now, since live data is dated in the current
    year and DGCA_REFERENCE only covers three fixed 2023 months.
    """
    if apix_daily_df.empty:
        live_data_period = None
    else:
        dates = pd.to_datetime(apix_daily_df["date"])
        live_data_period = f"{dates.min().date()} to {dates.max().date()}"

    reference_months = sorted(DGCA_REFERENCE["month"].unique())
    reference_period = f"{reference_months[0]} to {reference_months[-1]}" if reference_months else "no reference data"

    return {
        "has_overlap": not comparison_df.empty,
        "live_data_period": live_data_period,
        "reference_period": reference_period,
        "reference_data": DGCA_REFERENCE.to_dict(orient="records"),
    }
