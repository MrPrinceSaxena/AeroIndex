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
import pandas as pd

from src.index_engine.weights import ROUTE_WEIGHTS, DGCA_PAX_MILLIONS
from src.index_engine.compute_index import load_clean_fares, compute_daily_index, compute_weekly_index
from src.validation.cross_source_check import get_validation_summary
from src.api.analytics import (
    compute_route_heatmap,
    compute_elasticity,
    compute_data_coverage,
    generate_summary_sentence,
    compute_route_fare_history,
    compute_route_contributions,
    compute_catalog,
    compute_fare_summary,
    compute_fare_distribution,
    compute_airline_stats,
    compute_top_movers,
)
from src.cleaning.pipeline import load_raw_fares, deduplicate, flag_outliers, reconcile_fare_components
from src.api.data_quality import summarize_data_quality, outliers_by_group, compute_coverage_completeness
from src.backtest.compare_dgca import compare as compare_dgca, describe_comparison, DEVIATION_THRESHOLD_PCT
from src.api.quotes import load_fare_quotes_page
from src.ingestion.run_log import load_recent_runs, load_source_freshness, load_row_counts, check_db_connectivity
from src.api.system_health import compute_overall_status
from src.db.connection import close_pool

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


@app.on_event("shutdown")
def _close_db_pool() -> None:
    """Release pooled Postgres connections when the API stops."""
    close_pool()


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


class RouteHistoryPoint(BaseModel):
    date: date
    median_fare: float
    is_estimated: bool


class RouteHistoryResponse(BaseModel):
    route: str
    points: list[RouteHistoryPoint]
    generated_at: datetime


class RouteContribution(BaseModel):
    route: str
    weight: float
    fare_previous: float | None
    fare_latest: float | None
    log_return: float | None
    contribution: float | None


class RouteContributionsResponse(BaseModel):
    has_sufficient_data: bool
    from_date: date | None
    to_date: date | None
    total_log_change: float
    contributions: list[RouteContribution]
    generated_at: datetime


class OutlierGroupStat(BaseModel):
    route: str
    advance_purchase_days: int
    n_outliers: int
    n_total: int
    pct_outliers: float


class SourceRowCount(BaseModel):
    source_name: str
    n_rows: int


class DataQualityResponse(BaseModel):
    total_rows: int
    sold_out_pct: float
    duplicate_rows: int
    outlier_pct: float
    outliers_by_group: list[OutlierGroupStat]
    component_mismatch_pct: float
    rows_per_source: list[SourceRowCount]
    cross_source_validation: list[CrossSourceStat]
    # IDs the real cleaning pipeline flagged as outliers, so other views
    # (Data Explorer) can mark the same rows without re-deriving IQR logic.
    outlier_ids: list[str]
    expected_cells: int
    covered_cells: int
    completeness_pct: float
    generated_at: datetime


class BacktestComparisonRow(BaseModel):
    month: str
    route: str
    apix_avg: float
    dgca_avg_fare: float
    deviation_pct: float
    deviation_flagged: bool


class DgcaReferenceRow(BaseModel):
    month: str
    route: str
    dgca_avg_fare: float


class BacktestResponse(BaseModel):
    has_overlap: bool
    comparisons: list[BacktestComparisonRow]
    reference_data: list[DgcaReferenceRow]
    reference_period: str
    live_data_period: str | None
    deviation_threshold_pct: float
    generated_at: datetime


class FareQuoteRow(BaseModel):
    id: str
    route: str
    carrier: str | None
    date_scraped: date
    travel_date: date
    advance_purchase_days: int
    fare_class: str | None
    base_fare: float | None
    taxes: float | None
    total_fare: float
    source_name: str
    is_sold_out: bool


class FareQuotesResponse(BaseModel):
    rows: list[FareQuoteRow]
    total_count: int
    limit: int
    offset: int
    generated_at: datetime


class IngestionRunRecord(BaseModel):
    run_id: str
    step_name: str
    started_at: datetime
    finished_at: datetime | None
    status: str
    records_ingested: int
    error_message: str | None


class SourceFreshness(BaseModel):
    source_name: str
    latest_date_scraped: date | None
    latest_created_at: datetime | None
    rows: int


class TableRowCounts(BaseModel):
    fare_quotes: int
    cross_source_check: int
    ingestion_runs: int


class SystemHealthResponse(BaseModel):
    db_connectivity: Literal["ok", "error"]
    overall_status: Literal["healthy", "degraded", "down"]
    row_counts: TableRowCounts
    recent_runs: list[IngestionRunRecord]
    source_freshness: list[SourceFreshness]
    generated_at: datetime


class CatalogResponse(BaseModel):
    routes: list[str]
    airlines: list[str]
    sources: list[str]
    advance_purchase_windows: list[int]
    date_min: date | None
    date_max: date | None
    generated_at: datetime


class WindowIndex(BaseModel):
    advance_purchase_days: int
    latest_value: float
    change_pct: float | None
    is_estimated: bool
    n_points: int


class TopMover(BaseModel):
    route: str
    pct_change: float
    fare_previous: float
    fare_latest: float


class OverviewResponse(BaseModel):
    latest_value: float | None
    latest_date: date | None
    base_date: date | None
    change_pct: float | None
    routes_monitored: int
    airlines_monitored: int
    total_quotes: int
    real_quotes: int
    synthetic_quotes: int
    index_by_window: list[WindowIndex]
    top_movers: list[TopMover]
    generated_at: datetime


class FareBucket(BaseModel):
    bucket_start: float
    bucket_end: float
    count: int


class AirlineStat(BaseModel):
    carrier: str
    avg_fare: float
    min_fare: float
    max_fare: float
    n_fares: int


class RouteStatsResponse(BaseModel):
    filters_applied: dict
    avg_fare: float | None
    min_fare: float | None
    max_fare: float | None
    median_fare: float | None
    n_fares: int
    distribution: list[FareBucket]
    airlines: list[AirlineStat]
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


@app.get("/apix/route-history", response_model=RouteHistoryResponse)
async def get_route_history(route: Route = Query("DEL-BOM", description="One of DEL-BOM, DEL-BLR, BOM-BLR")):
    """Median fare over time for one route -- the Route Analytics drill-down chart."""
    try:
        df = load_clean_fares()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    history_df = compute_route_fare_history(df, route)
    points = [
        RouteHistoryPoint(
            date=row["travel_date"],
            median_fare=row["median_fare"],
            is_estimated=bool(row["is_estimated"]),
        )
        for _, row in history_df.iterrows()
    ]
    return RouteHistoryResponse(route=route, points=points, generated_at=datetime.utcnow())


@app.get("/apix/contributions", response_model=RouteContributionsResponse)
async def get_route_contributions():
    """
    Which route drove the latest index move, and by how much -- weight x
    log-return per route between the latest two dates. has_sufficient_data
    is False (not a 404) when fewer than 2 dates exist yet.
    """
    try:
        df = load_clean_fares()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    daily_df = compute_daily_index(df)
    result = compute_route_contributions(daily_df)
    return RouteContributionsResponse(
        has_sufficient_data=result["has_sufficient_data"],
        from_date=result["from_date"],
        to_date=result["to_date"],
        total_log_change=result["total_log_change"],
        contributions=[RouteContribution(**c) for c in result["contributions"]],
        generated_at=datetime.utcnow(),
    )


@app.get("/apix/data-quality", response_model=DataQualityResponse)
async def get_data_quality():
    """
    Real data-quality metrics, computed by running the actual cleaning
    functions from src/cleaning/pipeline.py against the current data --
    never a separate, potentially-diverging reimplementation of the same
    checks.
    """
    try:
        raw_df = load_raw_fares()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    deduped_df = deduplicate(raw_df)
    flagged_df = flag_outliers(deduped_df)
    reconciled_df = reconcile_fare_components(flagged_df)

    summary = summarize_data_quality(raw_df, deduped_df, flagged_df, reconciled_df)
    outlier_groups = outliers_by_group(flagged_df)

    try:
        validation_stats = get_validation_summary()
    except Exception:
        validation_stats = []

    return DataQualityResponse(
        total_rows=summary["total_rows"],
        sold_out_pct=summary["sold_out_pct"],
        duplicate_rows=summary["duplicate_rows"],
        outlier_pct=summary["outlier_pct"],
        outliers_by_group=[
            OutlierGroupStat(
                route=row["route"],
                advance_purchase_days=int(row["advance_purchase_days"]),
                n_outliers=int(row["n_outliers"]),
                n_total=int(row["n_total"]),
                pct_outliers=row["pct_outliers"],
            )
            for _, row in outlier_groups.iterrows()
        ],
        component_mismatch_pct=summary["component_mismatch_pct"],
        rows_per_source=[SourceRowCount(**r) for r in summary["rows_per_source"]],
        cross_source_validation=[CrossSourceStat(**s) for s in validation_stats],
        outlier_ids=(
            [str(i) for i in flagged_df.loc[flagged_df["is_outlier"], "id"]]
            if not flagged_df.empty and "id" in flagged_df.columns
            else []
        ),
        **compute_coverage_completeness(raw_df),
        generated_at=datetime.utcnow(),
    )


@app.get("/apix/backtest", response_model=BacktestResponse)
async def get_backtest():
    """
    Compares APIx's monthly averages against DGCA's published reference
    fares. has_overlap is very likely False right now -- live data is dated
    in the current year, DGCA_REFERENCE only covers three fixed 2023 months
    (a known placeholder, see AGENTS.md). reference_data is always returned
    regardless, so the page can prove real DGCA figures are on file even
    with zero overlap, instead of rendering a blank chart.
    """
    try:
        df = load_clean_fares()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    daily_df = compute_daily_index(df)
    comparison_df = compare_dgca(daily_df)
    described = describe_comparison(daily_df, comparison_df)

    return BacktestResponse(
        has_overlap=described["has_overlap"],
        comparisons=[
            BacktestComparisonRow(
                month=row["month"],
                route=row["route"],
                apix_avg=row["apix_avg"],
                dgca_avg_fare=row["dgca_avg_fare"],
                deviation_pct=row["deviation_pct"],
                deviation_flagged=bool(row["deviation_flagged"]),
            )
            for _, row in comparison_df.iterrows()
        ] if not comparison_df.empty else [],
        reference_data=[DgcaReferenceRow(**r) for r in described["reference_data"]],
        reference_period=described["reference_period"],
        live_data_period=described["live_data_period"],
        deviation_threshold_pct=DEVIATION_THRESHOLD_PCT,
        generated_at=datetime.utcnow(),
    )


@app.get("/apix/quotes", response_model=FareQuotesResponse)
async def get_fare_quotes(
    route: Route | None = Query(None),
    source_name: str | None = Query(None),
    advance_purchase_days: int | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    include_sold_out: bool = Query(True),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """
    Paginated, filterable view over the raw fare_quotes table -- the Data
    Explorer page. Includes sold-out rows by default (unlike /apix, which
    excludes them from the index) since this endpoint's job is showing
    everything that was collected. limit is hard-capped server-side at 500
    regardless of what the client requests.
    """
    try:
        df, total_count = load_fare_quotes_page(
            route=route,
            source_name=source_name,
            advance_purchase_days=advance_purchase_days,
            date_from=date_from,
            date_to=date_to,
            include_sold_out=include_sold_out,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    def _or_none(value):
        return None if pd.isna(value) else value

    rows = [
        FareQuoteRow(
            id=str(row["id"]),
            route=row["route"],
            carrier=_or_none(row["carrier"]),
            date_scraped=row["date_scraped"],
            travel_date=row["travel_date"],
            advance_purchase_days=int(row["advance_purchase_days"]),
            fare_class=_or_none(row["fare_class"]),
            base_fare=_or_none(row["base_fare"]),
            taxes=_or_none(row["taxes"]),
            total_fare=row["total_fare"],
            source_name=row["source_name"],
            is_sold_out=bool(row["is_sold_out"]),
        )
        for _, row in df.iterrows()
    ]
    return FareQuotesResponse(
        rows=rows, total_count=total_count, limit=limit, offset=offset, generated_at=datetime.utcnow()
    )


@app.get("/system/health", response_model=SystemHealthResponse)
async def get_system_health(run_limit: int = Query(20, le=100)):
    """
    Real pipeline status, not a guess: DB connectivity, row counts, recent
    ingestion_runs history, and per-source data freshness. Unlike every other
    data endpoint, this one never 500s or 503s -- describing an outage IS its
    job, so a DB-down state is returned as HTTP 200 with db_connectivity:
    "error" and overall_status: "down" rather than raised as an error.
    """
    db_ok = check_db_connectivity()

    if not db_ok:
        return SystemHealthResponse(
            db_connectivity="error",
            overall_status="down",
            row_counts=TableRowCounts(fare_quotes=0, cross_source_check=0, ingestion_runs=0),
            recent_runs=[],
            source_freshness=[],
            generated_at=datetime.utcnow(),
        )

    try:
        row_counts = load_row_counts()
        recent_runs = load_recent_runs(limit=run_limit)
        source_freshness = load_source_freshness()
    except Exception:
        # DB answered the connectivity ping but a real query still failed --
        # still describe this as down rather than raising.
        return SystemHealthResponse(
            db_connectivity="error",
            overall_status="down",
            row_counts=TableRowCounts(fare_quotes=0, cross_source_check=0, ingestion_runs=0),
            recent_runs=[],
            source_freshness=[],
            generated_at=datetime.utcnow(),
        )

    overall_status = compute_overall_status(db_ok, recent_runs, source_freshness)

    return SystemHealthResponse(
        db_connectivity="ok",
        overall_status=overall_status,
        row_counts=TableRowCounts(**row_counts),
        recent_runs=[
            IngestionRunRecord(
                run_id=str(r["run_id"]),
                step_name=r["step_name"],
                started_at=r["started_at"],
                finished_at=r["finished_at"],
                status=r["status"],
                records_ingested=r["records_ingested"],
                error_message=r["error_message"],
            )
            for r in recent_runs
        ],
        source_freshness=[
            SourceFreshness(
                source_name=s["source_name"],
                latest_date_scraped=s["latest_date_scraped"],
                latest_created_at=s["latest_created_at"],
                rows=s["rows"],
            )
            for s in source_freshness
        ],
        generated_at=datetime.utcnow(),
    )


@app.get("/apix/catalog", response_model=CatalogResponse)
async def get_catalog():
    """
    The filter values that actually exist in the data right now. Every filter
    dropdown in the UI is built from this, so the interface can never offer a
    route, airline or window that would return nothing.
    """
    try:
        df = load_raw_fares()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    return CatalogResponse(**compute_catalog(df), generated_at=datetime.utcnow())


@app.get("/apix/overview", response_model=OverviewResponse)
async def get_overview():
    """
    Landing-page KPIs: coverage counts, the headline index, a separate index
    per advance-purchase window, and the routes that moved most. The
    per-window indices reuse compute_daily_index() on a filtered slice rather
    than a second formula, so every number on the page traces back to the one
    locked index definition.
    """
    try:
        raw_df = load_raw_fares()
        clean_df = load_clean_fares()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    coverage = compute_data_coverage(raw_df) if not raw_df.empty else {"n_real": 0, "n_synthetic": 0}
    catalog = compute_catalog(raw_df)

    daily_df = compute_daily_index(clean_df)
    latest_value = latest_date = base_date = change_pct = None
    if not daily_df.empty:
        latest_value = float(daily_df.iloc[-1]["apix_value"])
        latest_date = daily_df.iloc[-1]["date"]
        base_date = daily_df.iloc[0]["date"]
        base_value = float(daily_df.iloc[0]["apix_value"])
        if base_value:
            change_pct = round((latest_value - base_value) / base_value * 100, 2)

    index_by_window: list[WindowIndex] = []
    for window in catalog["advance_purchase_windows"]:
        window_df = clean_df[clean_df["advance_purchase_days"] == window]
        window_daily = compute_daily_index(window_df)
        if window_daily.empty:
            continue
        w_latest = float(window_daily.iloc[-1]["apix_value"])
        w_base = float(window_daily.iloc[0]["apix_value"])
        index_by_window.append(
            WindowIndex(
                advance_purchase_days=int(window),
                latest_value=round(w_latest, 2),
                change_pct=round((w_latest - w_base) / w_base * 100, 2) if w_base else None,
                is_estimated=bool(window_daily.iloc[-1]["is_estimated"]),
                n_points=int(len(window_daily)),
            )
        )

    movers = compute_top_movers(compute_route_contributions(daily_df))

    return OverviewResponse(
        latest_value=round(latest_value, 2) if latest_value is not None else None,
        latest_date=latest_date,
        base_date=base_date,
        change_pct=change_pct,
        routes_monitored=len(catalog["routes"]),
        airlines_monitored=len(catalog["airlines"]),
        total_quotes=int(len(raw_df)),
        real_quotes=coverage["n_real"],
        synthetic_quotes=coverage["n_synthetic"],
        index_by_window=index_by_window,
        top_movers=[TopMover(**m) for m in movers],
        generated_at=datetime.utcnow(),
    )


@app.get("/apix/route-stats", response_model=RouteStatsResponse)
async def get_route_stats(
    route: Route | None = Query(None),
    airline: str | None = Query(None),
    advance_purchase_days: int | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
):
    """
    Fare statistics for an arbitrary filtered slice: headline avg/min/max,
    the distribution behind those averages, and a per-airline breakdown.
    Operates on bookable fares only -- sold-out rows carry total_fare = 0 and
    would drag the mean and minimum to meaningless values.
    """
    try:
        df = load_clean_fares()
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {e}")

    if not df.empty:
        if route:
            df = df[df["route"] == route]
        if advance_purchase_days is not None:
            df = df[df["advance_purchase_days"] == advance_purchase_days]
        if date_from:
            df = df[pd.to_datetime(df["travel_date"]) >= pd.Timestamp(date_from)]
        if date_to:
            df = df[pd.to_datetime(df["travel_date"]) <= pd.Timestamp(date_to)]
        if airline and "carrier" in df.columns:
            df = df[df["carrier"] == airline]

    summary = compute_fare_summary(df)
    distribution = compute_fare_distribution(df)
    airlines = compute_airline_stats(df)

    return RouteStatsResponse(
        filters_applied={
            "route": route,
            "airline": airline,
            "advance_purchase_days": advance_purchase_days,
            "date_from": str(date_from) if date_from else None,
            "date_to": str(date_to) if date_to else None,
        },
        **summary,
        distribution=[FareBucket(**b) for b in distribution.to_dict(orient="records")],
        airlines=[AirlineStat(**a) for a in airlines.to_dict(orient="records")],
        generated_at=datetime.utcnow(),
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "APIx", "version": "0.2.0"}
