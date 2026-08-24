"""
src/api/quotes.py

Backs GET /apix/quotes -- the Data Explorer page's paginated, filterable view
over the raw fare_quotes table. SQL-side filtering (not pandas-side): the one
endpoint where "load everything into memory" would be a real anti-pattern
once data volume grows, and it's the only place in the codebase that needs
dynamic WHERE clauses.

build_quotes_query() is pure (a string/params builder, no DB access) and
unit-tested without a database in tests/test_quotes_query.py.
load_fare_quotes_page() is the impure half that actually executes it.
"""

import os
from datetime import date
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
import pandas as pd
import psycopg2

from src.db.connection import db_connection

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")


def build_quotes_query(
    route: Optional[str] = None,
    source_name: Optional[str] = None,
    advance_purchase_days: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    include_sold_out: bool = True,
    limit: int = 50,
    offset: int = 0,
) -> tuple[str, list]:
    """
    Builds a parameterized SELECT with a COUNT(*) OVER() window so the total
    matching row count comes back in the same round trip as the page itself,
    instead of needing a second query.
    """
    where_clauses = []
    params: list = []

    if route:
        where_clauses.append("route = %s")
        params.append(route)
    if source_name:
        where_clauses.append("source_name = %s")
        params.append(source_name)
    if advance_purchase_days is not None:
        where_clauses.append("advance_purchase_days = %s")
        params.append(advance_purchase_days)
    if date_from:
        where_clauses.append("travel_date >= %s")
        params.append(date_from)
    if date_to:
        where_clauses.append("travel_date <= %s")
        params.append(date_to)
    if not include_sold_out:
        where_clauses.append("is_sold_out = FALSE")

    where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    sql = f"""
        SELECT id, route, carrier, date_scraped, travel_date, advance_purchase_days,
               fare_class, base_fare, taxes, total_fare, source_name, is_sold_out,
               COUNT(*) OVER() AS total_count
        FROM fare_quotes
        {where_sql}
        ORDER BY travel_date DESC, route
        LIMIT %s OFFSET %s;
    """
    params.extend([limit, offset])
    return sql, params


def load_fare_quotes_page(
    route: Optional[str] = None,
    source_name: Optional[str] = None,
    advance_purchase_days: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    include_sold_out: bool = True,
    limit: int = 50,
    offset: int = 0,
) -> tuple[pd.DataFrame, int]:
    """Executes build_quotes_query() and splits total_count back out of the result."""
    sql, params = build_quotes_query(
        route, source_name, advance_purchase_days, date_from, date_to, include_sold_out, limit, offset
    )
    with db_connection() as conn:
        df = pd.read_sql(sql, conn, params=params, parse_dates=["date_scraped", "travel_date"])

    if df.empty:
        return df.drop(columns=["total_count"], errors="ignore"), 0

    total_count = int(df.iloc[0]["total_count"])
    return df.drop(columns=["total_count"]), total_count
