"""
src/cleaning/pipeline.py

Phase 2 — Cleaning Pipeline

Steps (in order):
    1. Deduplication — remove exact-duplicate rows
    2. Outlier flagging — IQR method per route + advance_purchase_days
    3. Base/tax/total reconciliation — flag rows where base+taxes != total
    4. Sold-out handling — mark (do NOT delete) missing/sold-out entries

CRITICAL: source_name is preserved through every step.
It is NEVER dropped, overwritten, or set to NULL.
If a cleaning step would lose source_name, that step is wrong.
"""

import os
from pathlib import Path

import pandas as pd
import numpy as np
from dotenv import load_dotenv
import psycopg2

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")


def load_raw_fares() -> pd.DataFrame:
    """Load all fare_quotes from Postgres."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        df = pd.read_sql(
            "SELECT * FROM fare_quotes ORDER BY travel_date, route, source_name",
            conn,
            parse_dates=["date_scraped", "travel_date"],
        )
    finally:
        conn.close()
    return df


def deduplicate(df: pd.DataFrame) -> pd.DataFrame:
    """
    Step 1: Remove exact duplicates.
    'Exact' = same route + travel_date + advance_purchase_days + total_fare + source_name.
    Keeps the most recent date_scraped.
    """
    key_cols = ["route", "travel_date", "advance_purchase_days", "total_fare", "source_name"]
    before = len(df)
    df = df.sort_values("date_scraped", ascending=False)
    df = df.drop_duplicates(subset=key_cols, keep="first")
    after = len(df)
    print(f"Dedup: removed {before - after} exact duplicate rows.")
    return df


def flag_outliers(df: pd.DataFrame, iqr_multiplier: float = 2.5) -> pd.DataFrame:
    """
    Step 2: Flag statistical outliers using IQR within each route + advance window.
    Outliers are FLAGGED (is_outlier column added), NOT deleted.
    They may be real prices (e.g. surge pricing) — dropping them silently would
    understate actual fare volatility, which is the whole point of this tool.
    """
    df = df.copy()
    df["is_outlier"] = False

    for (route, adv), group in df.groupby(["route", "advance_purchase_days"]):
        fares = group["total_fare"].dropna()
        if len(fares) < 4:  # not enough data to compute meaningful IQR
            continue
        q1 = fares.quantile(0.25)
        q3 = fares.quantile(0.75)
        iqr = q3 - q1
        lower = q1 - iqr_multiplier * iqr
        upper = q3 + iqr_multiplier * iqr

        mask = (df["route"] == route) & (df["advance_purchase_days"] == adv)
        outlier_mask = mask & ((df["total_fare"] < lower) | (df["total_fare"] > upper))
        n_outliers = outlier_mask.sum()
        if n_outliers:
            print(f"Outlier flag: {route} T+{adv}: {n_outliers} rows outside "
                  f"[{lower:.0f}, {upper:.0f}] IQR band")
        df.loc[outlier_mask, "is_outlier"] = True

    return df


def reconcile_fare_components(df: pd.DataFrame, tolerance: float = 50.0) -> pd.DataFrame:
    """
    Step 3: Check that base_fare + taxes ≈ total_fare.
    Flag rows with a mismatch above tolerance (INR 50 default).
    """
    df = df.copy()
    df["component_mismatch"] = False

    has_components = df["base_fare"].notna() & df["taxes"].notna()
    reconstructed = df.loc[has_components, "base_fare"] + df.loc[has_components, "taxes"]
    mismatch = (reconstructed - df.loc[has_components, "total_fare"]).abs() > tolerance

    n_mismatch = mismatch.sum()
    if n_mismatch:
        print(f"Component mismatch: {n_mismatch} rows where base+taxes != total (>{tolerance} INR)")
    df.loc[has_components & mismatch, "component_mismatch"] = True
    return df


def run_pipeline() -> pd.DataFrame:
    """
    Run the full cleaning pipeline and return the cleaned DataFrame.
    source_name is verified to be present on every row before returning.
    """
    print("--- APIx Cleaning Pipeline ---")
    df = load_raw_fares()
    print(f"Loaded {len(df)} raw fare records.")

    df = deduplicate(df)
    df = flag_outliers(df)
    df = reconcile_fare_components(df)

    # INVARIANT CHECK: source_name must never be null after cleaning
    null_source = df["source_name"].isna().sum()
    if null_source:
        raise ValueError(
            f"PIPELINE ERROR: {null_source} rows have null source_name after cleaning. "
            f"This must never happen — check the pipeline steps above."
        )

    print(f"Cleaning complete. {len(df)} records retained, source_name intact on all rows.")
    return df


if __name__ == "__main__":
    clean_df = run_pipeline()
    output_path = Path("data/clean/fare_quotes_clean.csv")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    clean_df.to_csv(output_path, index=False)
    print(f"Saved to {output_path}")
