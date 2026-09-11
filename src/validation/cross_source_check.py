"""
src/validation/cross_source_check.py

Phase 1c — Cross-source validation

Wherever Source 1 (air_india_direct) and Source 2 (indigo_direct) both have
a quote for the same route + travel_date + advance_purchase_days,
compute the absolute % difference and log it to the cross_source_check table.

This is the on-stage proof that our index numbers are not an artifact of one
website's pricing quirks. It surfaces in the Methodology panel in Phase 5.

Sign convention:
    pct_difference = ABS(price_a - price_b) / price_a * 100
    Always positive. We report the magnitude of disagreement, not direction.
"""

import os
from datetime import date
from pathlib import Path

import numpy as np
import pandas as pd
from dotenv import load_dotenv
import psycopg2

from src.db.connection import db_connection
from psycopg2.extras import execute_values

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")


def compute_cross_source_differences(
    df: pd.DataFrame,
    source_a: str = "air_india_direct",
    source_b: str = "indigo_direct",
) -> pd.DataFrame:
    """
    Given a DataFrame of fare_quotes records, find overlapping (route, travel_date,
    advance_purchase_days) pairs where both source_a and source_b have a quote,
    and compute the % price difference.

    Args:
        df: DataFrame with columns matching fare_quotes schema
        source_a: Name of the first source
        source_b: Name of the second source

    Returns:
        DataFrame with columns matching cross_source_check schema
    """
    # Filter to real data only — synthetic is never included in cross-source comparison
    df_real = df[df["source_name"] != "synthetic_estimate"].copy()

    df_a = df_real[df_real["source_name"] == source_a].copy()
    df_b = df_real[df_real["source_name"] == source_b].copy()

    # Join on the triplet key: route + travel_date + advance_purchase_days
    joined = pd.merge(
        df_a[["route", "travel_date", "advance_purchase_days", "total_fare"]],
        df_b[["route", "travel_date", "advance_purchase_days", "total_fare"]],
        on=["route", "travel_date", "advance_purchase_days"],
        suffixes=("_a", "_b"),
    )

    if joined.empty:
        return pd.DataFrame(columns=[
            "route", "travel_date", "advance_purchase_days",
            "source_a", "source_b", "price_a", "price_b", "pct_difference"
        ])

    joined["source_a"] = source_a
    joined["source_b"] = source_b
    joined["price_a"] = joined["total_fare_a"]
    joined["price_b"] = joined["total_fare_b"]
    denom = joined["price_a"].replace(0, np.nan)
    joined["pct_difference"] = (
        ((joined["price_a"] - joined["price_b"]).abs() / denom * 100)
        .fillna(0.0)
        .round(2)
    )

    return joined[[
        "route", "travel_date", "advance_purchase_days",
        "source_a", "source_b", "price_a", "price_b", "pct_difference"
    ]]


def save_to_db(cross_df: pd.DataFrame) -> int:
    """
    Upsert cross-source check results into the cross_source_check table.
    Returns the number of rows inserted.
    """
    if cross_df.empty:
        print("No overlapping records found between sources — nothing to log.")
        return 0

    rows = [
        (
            str(row["route"]),
            row["travel_date"] if isinstance(row["travel_date"], date)
                else pd.to_datetime(row["travel_date"]).date(),
            int(row["advance_purchase_days"]),
            str(row["source_a"]),
            str(row["source_b"]),
            float(row["price_a"]),
            float(row["price_b"]),
            float(row["pct_difference"]),
        )
        for _, row in cross_df.iterrows()
    ]

    with db_connection() as conn:
        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO cross_source_check
                    (route, travel_date, advance_purchase_days,
                     source_a, source_b, price_a, price_b, pct_difference)
                VALUES %s
                ON CONFLICT DO NOTHING;
                """,
                rows,
            )
        conn.commit()
        print(f"Logged {len(rows)} cross-source comparison records.")
        return len(rows)


def get_validation_summary() -> dict:
    """
    Fetch cross-source validation stats for the Methodology panel.
    Returns a dict with mean/max % difference per route — used in the dashboard.
    """
    with db_connection() as conn:
        df = pd.read_sql(
            """
            SELECT route,
                   advance_purchase_days,
                   ROUND(AVG(pct_difference)::numeric, 2) AS mean_pct_diff,
                   ROUND(MAX(pct_difference)::numeric, 2) AS max_pct_diff,
                   COUNT(*) AS n_comparisons
            FROM cross_source_check
            GROUP BY route, advance_purchase_days
            ORDER BY route, advance_purchase_days;
            """,
            conn,
        )
    return df.to_dict(orient="records")
