"""
src/api/main.py

APIx FastAPI backend — Phase 5

Endpoints:
    GET /apix              Latest index value + historical series + methodology metadata
    GET /apix/heatmap       Median real fare by route x advance-purchase window
    GET /apix/elasticity     Median fare by advance-purchase window x source, for one route
    GET /apix/summary       Auto-generated plain-English "what this means" sentence
    GET /health             Liveness check

Why metadata alongside the number:
    A bare number ("APIx = 112.3") is not usable by NSO or RBI.
    They need to know: what routes, what weights, what sources, how validated.
    The metadata in /apix's response IS the answer to 'why should we trust this?'
    — the same answer the frontend's Methodology page surfaces.

Why /apix/heatmap, /apix/elasticity, /apix/summary are separate endpoints
rather than folded into /apix:
    The frontend fetches/caches/error-handles each dashboard panel
    independently (React Query, one hook per endpoint) — a slow or failing
    elasticity query must not block the trend chart or methodology panel from
    rendering. A single fat /apix response would couple all of that together.

Run: uvicorn src.api.main:app --reload
"""

import os
from pathlib import Path
from datetime import date, datetime
from typing import Literal

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from src.index_engine.weights import ROUTE_WEIGHTS, DGCA_PAX_MILLIONS
from src.index_engine.compute_index import load_clean_fares, compute_daily_index, compute_weekly_index
from src.validation.cross_source_check import get_validation_summary
from src.api.analytics import (
    compute_route_heatmap,
    compute_elasticity,
    compute_data_coverage,
    generate_summary_sentence,
)

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

Route = Literal["DEL-BOM", "DEL-BLR", "BOM-BLR"]

app = FastAPI(
    title="APIx — Real-time Airfare Price Index",
    description=(
        "Prototype index for India's NSO/RBI. Returns a weighted airfare price index "
        "for 3 domestic routes, built from two independent airline-direct sources. "
        "Methodology metadata is returned alongside every number."
    ),
    version="0.2.0",
)

# CORS_ORIGINS is a comma-separated list (e.g. the deployed frontend's URL in
# production); defaults to "*" for local development against the Vite dev server.
_cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Last-resort safety net: an unhandled bug must never leak a raw stack
    trace to the frontend. Expected failure modes (DB down, no data yet) are
    already handled per-endpoint with specific status codes below; this only
    catches genuine bugs.
    """
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ─── Response models ──────────────────────────────────────────────────────

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


class DataCoverage(BaseModel):
    n_real: int
    n_synthetic: int


class APIxResponse(BaseModel):
    latest_value: float
    latest_date: date
    base_value: float
    base_date: date
    daily_series: list[IndexPoint]
    weekly_series: list[dict]
    methodology: Methodology
    data_coverage: DataCoverage
    generated_at: datetime


class HeatmapCell(BaseModel):
    route: str
    advance_purchase_days: int
    median_fare: float


class HeatmapResponse(BaseModel):
    cells: list[HeatmapCell]
    generated_at: datetime


class ElasticityPoint(BaseModel):
    advance_purchase_days: int
    source_name: str
    median_fare: float


class ElasticityResponse(BaseModel):
    route: str
    points: list[ElasticityPoint]
    generated_at: datetime


class SummaryResponse(BaseModel):
    summary: str
    has_sufficient_data: bool
    generated_at: datetime


# ─── Endpoints ─────────────────────────────────────────────────────────────

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
        data_coverage=DataCoverage(**compute_data_coverage(df)),
        generated_at=datetime.utcnow(),
    )


@app.get("/apix/heatmap", response_model=HeatmapResponse)
async def get_apix_heatmap():
    """
    Median real fare by route x advance-purchase window. Real data only —
    synthetic estimates are excluded, not blended in. Returns cells: [] (HTTP
    200, not an error) when no real data exists yet; the frontend owns the
    "will appear once real data is loaded" copy for that case.
    """
    try:
        df = load_clean_fares()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    heatmap_df = compute_route_heatmap(df)
    cells = [
        HeatmapCell(route=row["route"], advance_purchase_days=int(row["advance_purchase_days"]), median_fare=row["median_fare"])
        for _, row in heatmap_df.iterrows()
    ]
    return HeatmapResponse(cells=cells, generated_at=datetime.utcnow())


@app.get("/apix/elasticity", response_model=ElasticityResponse)
async def get_apix_elasticity(route: Route = Query("DEL-BOM", description="One of DEL-BOM, DEL-BLR, BOM-BLR")):
    """
    Median fare by advance-purchase window x source, for one route — shows
    the lead-time price premium, split by source so real and synthetic are
    never blended into a single bar.
    """
    try:
        df = load_clean_fares()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    elasticity_df = compute_elasticity(df, route)
    points = [
        ElasticityPoint(
            advance_purchase_days=int(row["advance_purchase_days"]),
            source_name=row["source_name"],
            median_fare=row["median_fare"],
        )
        for _, row in elasticity_df.iterrows()
    ]
    return ElasticityResponse(route=route, points=points, generated_at=datetime.utcnow())


@app.get("/apix/summary", response_model=SummaryResponse)
async def get_apix_summary():
    """Auto-generated plain-English sentence — the direct answer to 'what can government actually do with this.'"""
    try:
        df = load_clean_fares()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    daily_df = compute_daily_index(df)
    result = generate_summary_sentence(daily_df, df)
    return SummaryResponse(
        summary=result["summary"],
        has_sufficient_data=result["has_sufficient_data"],
        generated_at=datetime.utcnow(),
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "APIx", "version": "0.2.0"}
