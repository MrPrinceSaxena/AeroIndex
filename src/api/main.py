"""
src/api/main.py

APIx FastAPI endpoint — Phase 5

The /apix endpoint returns:
    - The latest index value
    - Historical index series (daily + weekly)
    - Methodology metadata: route weights, source names, cross-source validation stats

Why metadata alongside the number:
    A bare number ("APIx = 112.3") is not usable by NSO or RBI.
    They need to know: what routes, what weights, what sources, how validated.
    The metadata in this response IS the answer to 'why should we trust this?'
    — the same answer as the Methodology panel in the dashboard.

Run: uvicorn src.api.main:app --reload
"""

import os
from pathlib import Path
from datetime import date, datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from dotenv import load_dotenv
import psycopg2

from src.index_engine.weights import ROUTE_WEIGHTS, DGCA_PAX_MILLIONS
from src.index_engine.compute_index import load_clean_fares, compute_daily_index, compute_weekly_index
from src.validation.cross_source_check import get_validation_summary

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

app = FastAPI(
    title="APIx — Real-time Airfare Price Index",
    description=(
        "Prototype index for India's NSO/RBI. Returns a weighted airfare price index "
        "for 3 domestic routes, built from two independent airline-direct sources. "
        "Methodology metadata is returned alongside every number."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_methods=["GET"],
    allow_headers=["*"],
)


class RouteWeight(BaseModel):
    route: str
    weight: float
    pax_millions_fy2223: float
    source: str


class CrossSourceStat(BaseModel):
    route: str
    advance_purchase_days: int
    mean_pct_diff: float
    max_pct_diff: float
    n_comparisons: int


class Methodology(BaseModel):
    index_formula: str
    chain_linking: str
    route_weights: list[RouteWeight]
    data_sources: list[str]
    cross_source_validation: list[CrossSourceStat]
    weights_data_source: str


class IndexPoint(BaseModel):
    date: date
    apix_value: float
    is_estimated: bool  # True if synthetic data contributes to this point


class APIxResponse(BaseModel):
    latest_value: float
    latest_date: date
    base_value: float
    base_date: date
    daily_series: list[IndexPoint]
    weekly_series: list[dict]
    methodology: Methodology
    generated_at: datetime


@app.get("/apix", response_model=APIxResponse)
async def get_apix_index():
    """
    Returns the latest APIx value + historical series + methodology metadata.

    is_estimated=True on any IndexPoint means synthetic data contributed to
    that day's index value. Never blend estimated and real data silently.
    """
    try:
        df = load_clean_fares()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail="No fare data available yet. Run the ingestion pipeline first."
        )

    daily_df = compute_daily_index(df)
    weekly_df = compute_weekly_index(daily_df)

    if daily_df.empty:
        raise HTTPException(status_code=404, detail="Could not compute index from available data.")

    # Cross-source validation stats (may be empty before Phase 1c runs)
    try:
        validation_stats = get_validation_summary()
    except Exception:
        validation_stats = []

    methodology = Methodology(
        index_formula="DGCA-traffic-weighted chain-linked geometric mean",
        chain_linking="Monthly — resets base each calendar month to limit index drift",
        route_weights=[
            RouteWeight(
                route=route,
                weight=weight,
                pax_millions_fy2223=DGCA_PAX_MILLIONS[route],
                source="DGCA Annual Traffic Survey FY2022-23",
            )
            for route, weight in ROUTE_WEIGHTS.items()
        ],
        data_sources=["air_india_direct", "indigo_direct", "synthetic_estimate (gap-filler only)"],
        cross_source_validation=[
            CrossSourceStat(**s) for s in validation_stats
        ],
        weights_data_source=(
            "DGCA Annual Traffic Survey — Domestic Traffic Statistics, "
            "Directorate General of Civil Aviation, India. FY2022-23."
        ),
    )

    daily_series = [
        IndexPoint(date=row["date"], apix_value=row["apix_value"], is_estimated=row["is_estimated"])
        for _, row in daily_df.iterrows()
    ]

    latest = daily_df.iloc[-1]
    first = daily_df.iloc[0]

    return APIxResponse(
        latest_value=latest["apix_value"],
        latest_date=latest["date"],
        base_value=100.0,
        base_date=first["date"],
        daily_series=daily_series,
        weekly_series=weekly_df.to_dict(orient="records") if not weekly_df.empty else [],
        methodology=methodology,
        generated_at=datetime.utcnow(),
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "APIx", "version": "0.1.0"}
