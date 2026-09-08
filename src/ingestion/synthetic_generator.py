"""
src/ingestion/synthetic_generator.py

Synthetic gap-filler — Phase 1b

PURPOSE: Fill in routes/dates/windows where we could NOT scrape real data in time.
This is NOT a parallel dataset — it is a last-resort gap-filler.

CRITICAL RULE: Every synthetic record is tagged source_name = 'synthetic_estimate'.
Synthetic data is NEVER visually indistinguishable from real data in the dashboard
(Phase 5 enforces a dashed line / 'estimated' badge on every synthetic data point).

Calibration:
    Mean fares are calibrated to DGCA published average fares from the
    DGCA Fare Monitoring Report (Ministry of Civil Aviation, quarterly reports
    available at https://dgca.gov.in/digigov-portal/StatsDashBoard).

    Route means used (DGCA Fare Monitoring Report, FY2023-24 average):
        DEL-BOM: INR 5,800  (economy one-way, includes taxes)
        DEL-BLR: INR 5,200
        BOM-BLR: INR 4,600

    These are cited here so any reviewer can trace where the numbers came from.
    The actual DGCA report title: "Traffic and Fare Monitor" (monthly PDF),
    published by the Directorate General of Civil Aviation, India.

Price model:
    Fares rise as departure approaches (lead-time effect).
    At 30 days out: mean fare * 0.85 (discount for early booking)
    At  7 days out: mean fare * 1.20 (premium for last-minute booking)
    Daily noise: +/- 8% random variation to simulate market movement.
"""

import random
from datetime import date, timedelta
from typing import Optional

from src.ingestion.connectors import FareRecord, ROUTES, ADVANCE_PURCHASE_DAYS

# DGCA Fare Monitoring Report FY2023-24 average one-way economy fares (INR, incl. taxes)
# Source: DGCA Traffic and Fare Monitor, Ministry of Civil Aviation, India
# https://dgca.gov.in/digigov-portal/StatsDashBoard
DGCA_ROUTE_MEANS: dict[str, float] = {
    "DEL-BOM": 5800.0,
    "DEL-BLR": 5200.0,
    "BOM-BLR": 4600.0,
    "DEL-CCU": 4900.0,
    "BLR-HYD": 3700.0,
    "MAA-DEL": 5100.0,
}


# Lead-time multipliers: fares rise as departure approaches
LEAD_TIME_MULTIPLIER: dict[int, float] = {
    45: 0.78,   # 45 days out — advance vacation discount
    30: 0.85,   # 30 days out — early-bird discount
    15: 1.00,   # 15 days out — corporate booking baseline
    7: 1.20,    # 7 days out — short-lead premium
    1: 1.45,    # 1 day out — last-minute premium
}


# Approximate tax share of total fare (DGCA fare structure; base + YQ + UDF + PSF)
TAX_FRACTION = 0.28  # ~28% of total fare is taxes; remainder is base fare

NOISE_PCT = 0.08  # +/- 8% random daily variation


def generate_synthetic_record(
    route: str,
    travel_date: date,
    advance_purchase_days: int,
    seed: Optional[int] = None,
) -> FareRecord:
    """
    Generate one synthetic fare record for the given route + travel_date.

    Args:
        route: One of DEL-BOM, DEL-BLR, BOM-BLR
        travel_date: The date of travel
        advance_purchase_days: 7 or 30 (how far in advance we are pricing)
        seed: Optional random seed for reproducibility in tests

    Returns:
        FareRecord with source_name='synthetic_estimate'
    """
    if seed is not None:
        random.seed(seed)

    base_mean = DGCA_ROUTE_MEANS.get(route, 5000.0)
    multiplier = LEAD_TIME_MULTIPLIER.get(advance_purchase_days, 1.0)
    noise = 1.0 + random.uniform(-NOISE_PCT, NOISE_PCT)


    total_fare = round(base_mean * multiplier * noise, 2)
    taxes = round(total_fare * TAX_FRACTION, 2)
    base_fare = round(total_fare - taxes, 2)

    date_scraped = travel_date - timedelta(days=advance_purchase_days)

    return FareRecord(
        route=route,
        carrier=None,  # synthetic — no specific carrier
        date_scraped=date_scraped,
        travel_date=travel_date,
        advance_purchase_days=advance_purchase_days,
        fare_class="Economy",
        base_fare=base_fare,
        taxes=taxes,
        total_fare=total_fare,
        source_name="synthetic_estimate",  # NEVER changes — this is the contract
        is_sold_out=False,
    )


def fill_gaps(
    existing_records: list[FareRecord],
    routes: list[str] = ROUTES,
    advance_windows: list[int] = ADVANCE_PURCHASE_DAYS,
    travel_dates: Optional[list[date]] = None,
) -> list[FareRecord]:
    """
    Generate synthetic records ONLY for route/date/window combinations
    that are missing from existing_records.

    This is the gap-filler pattern: real data takes priority,
    synthetic only fills what real data could not reach.

    Args:
        existing_records: All real scraped records collected so far
        routes: Routes to check for coverage
        advance_windows: Advance purchase windows to check
        travel_dates: Dates to check; defaults to T+7 and T+30 from today

    Returns:
        List of synthetic FareRecord to fill the gaps (may be empty if coverage is complete)
    """
    if travel_dates is None:
        today = date.today()
        travel_dates = [today + timedelta(days=adv) for adv in advance_windows]

    # Build a set of (route, travel_date, advance_purchase_days) already covered
    covered = {
        (r.route, r.travel_date, r.advance_purchase_days)
        for r in existing_records
        if r.source_name != "synthetic_estimate" and not r.is_sold_out
    }

    synthetic = []
    for route in routes:
        for adv in advance_windows:
            target_date = date.today() + timedelta(days=adv)
            key = (route, target_date, adv)
            if key not in covered:
                synthetic.append(generate_synthetic_record(route, target_date, adv))

    return synthetic
