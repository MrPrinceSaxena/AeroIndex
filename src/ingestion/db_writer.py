"""
src/ingestion/db_writer.py

Persists FareRecord objects (from connectors or the synthetic generator) into
the fare_quotes table. This is the missing link between ingestion and every
downstream phase -- cleaning, the index engine, and the API all read from
fare_quotes, so nothing in the pipeline runs without this step.
"""

import json
import os
from pathlib import Path

from dotenv import load_dotenv
import psycopg2

from src.db.connection import db_connection
from psycopg2.extras import execute_values

from src.ingestion.connectors import FareRecord

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")


def save_fare_records(records: list[FareRecord]) -> int:
    """
    Insert FareRecord objects into fare_quotes. Returns the number of records
    submitted for insert.

    ON CONFLICT DO NOTHING makes this safe to re-run: fare_quotes has no
    natural-key unique constraint (each row gets its own generated UUID), so
    this is a no-op safety net today and becomes load-bearing automatically
    if a unique constraint is ever added later.
    """
    if not records:
        return 0

    rows = [
        (
            r.route,
            r.carrier,
            r.date_scraped,
            r.travel_date,
            r.advance_purchase_days,
            r.fare_class,
            r.base_fare,
            r.taxes,
            r.total_fare,
            r.source_name,
            r.is_sold_out,
            getattr(r, "data_origin", "imputed" if r.source_name == "synthetic_estimate" else "observed"),
            getattr(r, "channel", "web_direct"),
            json.dumps(r.provenance) if getattr(r, "provenance", None) else None,
        )
        for r in records
    ]

    with db_connection() as conn:
        with conn.cursor() as cur:
            execute_values(
                cur,
                """
                INSERT INTO fare_quotes
                    (route, carrier, date_scraped, travel_date, advance_purchase_days,
                     fare_class, base_fare, taxes, total_fare, source_name, is_sold_out,
                     data_origin, channel, provenance)
                VALUES %s
                ON CONFLICT DO NOTHING;
                """,
                rows,
            )
        conn.commit()
    print(f"Saved {len(rows)} fare_quotes records.")
    return len(rows)

