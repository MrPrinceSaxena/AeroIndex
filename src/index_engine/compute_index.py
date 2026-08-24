"""
src/index_engine/compute_index.py

APIx Index Engine — Phase 3

ONE FORMULA, LOCKED:
    Fixed-basket, DGCA-traffic-weighted, chain-linked price index.

Formula:
    I(t) = I(t-1) * PRODUCT_over_routes[
        (fare(route, t) / fare(route, t-1)) ^ weight(route)
    ]

Why this formula and not Laspeyres or Jevons:
    We use a chain-linked weighted geometric mean because:
    1. WEIGHTING: naive average would let BOM-BLR (smallest corridor) drag the index
       as much as DEL-BOM (3x the passengers) — wrong. Traffic weights fix this.
    2. CHAIN-LINKING: using a fixed base period (e.g. January) causes index drift
       as the basket composition shifts over time. Monthly chain-linking resets the
       base each month so drift stays bounded and the index remains comparable to
       DGCA's published fare data.
    3. WHY NOT LASPEYRES: Laspeyres uses fixed-period quantity weights and is simpler,
       but overstates inflation when consumers substitute away from expensive routes.
       For government policy use, chain-linking is the international standard
       (same approach used in India's CPI and GDP deflator).
    4. WHY NOT FISHER/JEVONS: Fisher requires both current and past quantity data
       (we only have prices). Jevons is a pure geometric mean with no traffic weighting.
       Neither is more defensible than our weighted chain-linked approach for this use case.

Base index value: 100.0 (set at the first date of available real data)
"""

import os
from pathlib import Path

import pandas as pd
import numpy as np
from dotenv import load_dotenv
import psycopg2

from src.db.connection import db_connection

from src.index_engine.weights import ROUTE_WEIGHTS

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")

BASE_INDEX = 100.0


def load_clean_fares() -> pd.DataFrame:
    """
    Load cleaned fare data from fare_quotes.
    Excludes sold-out entries from index calculation.
    Preserves source_name for transparency.
    """
    with db_connection() as conn:
        df = pd.read_sql(
            """
            SELECT route, carrier, travel_date, advance_purchase_days,
                   total_fare, source_name, is_sold_out
            FROM fare_quotes
            WHERE is_sold_out = FALSE
            ORDER BY travel_date, route
            """,
            conn,
            parse_dates=["travel_date"],
        )
    return df


def compute_daily_index(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute the APIx index for each date in the dataset.

    Returns a DataFrame with columns:
        date_scraped, apix_value, is_estimated (bool — True if synthetic data
        contributes to this day's index), per_route_fares (dict)
    """
    # Use median fare per route per date (more robust than mean to outliers)
    # Note: source_name is retained for transparency but averaged across sources
    daily = (
        df.groupby(["travel_date", "route"])
        .agg(
            median_fare=("total_fare", "median"),
            has_real=("source_name", lambda s: any(v != "synthetic_estimate" for v in s)),
        )
        .reset_index()
    )

    dates = sorted(daily["travel_date"].unique())
    if not dates:
        return pd.DataFrame()

    records = []
    prev_fare_by_route: dict[str, float] = {}
    index_value = BASE_INDEX

    for i, dt in enumerate(dates):
        day_data = daily[daily["travel_date"] == dt]
        fare_by_route = dict(zip(day_data["route"], day_data["median_fare"]))
        real_by_route = dict(zip(day_data["route"], day_data["has_real"]))

        if i == 0:
            # Anchor point — index = 100 on first date
            prev_fare_by_route = fare_by_route
            records.append({
                "date": dt,
                "apix_value": round(index_value, 2),
                "is_estimated": not all(real_by_route.get(r, False) for r in ROUTE_WEIGHTS),
                "per_route_fares": fare_by_route,
            })
            continue

        # Chain-linked weighted geometric mean step
        exponent_sum = 0.0
        covered_routes = []
        for route, weight in ROUTE_WEIGHTS.items():
            if route in fare_by_route and route in prev_fare_by_route:
                ratio = fare_by_route[route] / prev_fare_by_route[route]
                exponent_sum += weight * np.log(ratio)
                covered_routes.append(route)

        if covered_routes:
            index_value = index_value * np.exp(exponent_sum)
            prev_fare_by_route = fare_by_route

        is_estimated = not all(real_by_route.get(r, False) for r in ROUTE_WEIGHTS)

        records.append({
            "date": dt,
            "apix_value": round(index_value, 2),
            "is_estimated": is_estimated,
            "per_route_fares": fare_by_route,
        })

    return pd.DataFrame(records)


def compute_weekly_index(daily_df: pd.DataFrame) -> pd.DataFrame:
    """
    Aggregate daily index to weekly.
    Week = ISO week. Uses mean of daily APIx values within each week.
    is_estimated = True if ANY day in the week has synthetic data.
    """
    if daily_df.empty:
        return pd.DataFrame()

    df = daily_df.copy()
    df["week"] = df["date"].dt.to_period("W")
    weekly = (
        df.groupby("week")
        .agg(
            apix_value=("apix_value", "mean"),
            is_estimated=("is_estimated", "any"),
        )
        .reset_index()
    )
    weekly["apix_value"] = weekly["apix_value"].round(2)
    # pandas Period isn't JSON-serializable -- stringify before this leaves
    # pandas (e.g. into the FastAPI response), or downstream serialization breaks.
    weekly["week"] = weekly["week"].astype(str)
    return weekly
