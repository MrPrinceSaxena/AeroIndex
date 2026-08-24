"""
src/api/analytics.py

Pure analytics functions backing the /apix/heatmap, /apix/elasticity, and
/apix/summary endpoints. No DB access here -- same load-vs-compute split as
src/index_engine/compute_index.py, so every function here is unit-testable
against an in-memory DataFrame (see tests/test_analytics.py).

These are direct extractions of logic that used to live inline in the
Streamlit dashboard (dashboard/app.py), now needed by src/api/main.py since
the React frontend can only consume HTTP JSON, not run pandas itself.
"""

from typing import Optional

import pandas as pd


def compute_route_heatmap(df: pd.DataFrame) -> pd.DataFrame:
    """
    Median total_fare by route x advance_purchase_days, real data only.
    Synthetic data is excluded here (not just flagged) because the heatmap
    is meant to answer "what do real fares look like right now" -- mixing in
    synthetic estimates would silently distort it, which this project's
    real-vs-estimated rule never allows.

    Returns an empty DataFrame (never raises) when no real data exists yet.
    """
    real = df[df["source_name"] != "synthetic_estimate"]
    if real.empty:
        return pd.DataFrame(columns=["route", "advance_purchase_days", "median_fare"])

    return (
        real.groupby(["route", "advance_purchase_days"])
        .agg(median_fare=("total_fare", "median"))
        .reset_index()
    )


def compute_elasticity(df: pd.DataFrame, route: str) -> pd.DataFrame:
    """
    Median total_fare by advance_purchase_days x source_name for one route --
    shows the lead-time price premium, split by source so real and synthetic
    are never blended into a single bar.
    """
    route_df = df[df["route"] == route]
    if route_df.empty:
        return pd.DataFrame(columns=["advance_purchase_days", "source_name", "median_fare"])

    return (
        route_df.groupby(["advance_purchase_days", "source_name"])
        .agg(median_fare=("total_fare", "median"))
        .reset_index()
    )


def compute_data_coverage(df: pd.DataFrame) -> dict:
    """Real vs. synthetic row counts -- backs the 'Data Coverage' metric card."""
    n_synthetic = int((df["source_name"] == "synthetic_estimate").sum())
    n_real = int(len(df) - n_synthetic)
    return {"n_real": n_real, "n_synthetic": n_synthetic}


def generate_summary_sentence(daily_df: pd.DataFrame, raw_df: pd.DataFrame) -> dict:
    """
    Auto-generated plain-English "what this means" sentence -- the direct
    answer to "what can government actually do with this."

    Returns {"summary": str, "has_sufficient_data": bool} rather than a
    hardcoded fallback string, so callers branch on the boolean instead of
    string-matching a particular sentence.
    """
    if daily_df.empty or len(daily_df) < 2:
        return {
            "summary": "Not enough data for a trend statement yet.",
            "has_sufficient_data": False,
        }

    latest_val = daily_df.iloc[-1]["apix_value"]
    prev_val = daily_df.iloc[-2]["apix_value"]
    chg_pct = (latest_val - prev_val) / prev_val * 100

    top_route: Optional[str] = None
    if not raw_df.empty:
        recent_dates = sorted(raw_df["travel_date"].unique())[-2:]
        if len(recent_dates) == 2:
            recent = raw_df[raw_df["travel_date"].isin(recent_dates)]
            route_chg = (
                recent.groupby(["travel_date", "route"])
                .agg(med=("total_fare", "median"))
                .reset_index()
                .pivot(index="travel_date", columns="route", values="med")
                .pct_change()
                .iloc[-1]
            )
            if not route_chg.empty and route_chg.notna().any():
                top_route = route_chg.idxmax()

    rising = chg_pct > 0
    direction_verb = "rose" if rising else "fell"
    direction_adj = "up" if rising else "down"
    if top_route:
        summary = (
            f"Fares {direction_verb} mainly on {top_route} this period, "
            f"pushing the APIx {direction_adj} by {abs(chg_pct):.1f}% "
            f"(from {prev_val:.1f} to {latest_val:.1f})."
        )
    else:
        summary = f"The APIx moved by {chg_pct:+.1f}% in the latest observation."

    return {"summary": summary, "has_sufficient_data": True}
