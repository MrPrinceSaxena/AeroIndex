"""
src/ingestion/run_log.py

Read/write access to the ingestion_runs table -- the real record of every
`python -m src.ingestion.run_all` invocation, one row per step. This is what
lets the System Health page show actual pipeline history instead of a guess.

log_run_step() is the only writer, called from src/ingestion/run_all.py.
The load_*() functions are the readers, called from src/api/system_health.py.
check_db_connectivity() is used standalone by the /system/health endpoint,
which must describe a down database rather than raise on one.
"""

import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

from src.db.connection import db_connection

load_dotenv(Path(__file__).resolve().parents[2] / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")


def log_run_step(
    run_id: uuid.UUID,
    step_name: str,
    started_at: datetime,
    finished_at: datetime,
    status: str,
    records_ingested: int,
    error_message: Optional[str] = None,
) -> None:
    """Insert one row describing one step of one ingestion run."""
    with db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ingestion_runs
                    (run_id, step_name, started_at, finished_at, status, records_ingested, error_message)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
                """,
                (str(run_id), step_name, started_at, finished_at, status, records_ingested, error_message),
            )
        conn.commit()


def load_recent_runs(limit: int = 20) -> list[dict]:
    """Most recent ingestion_runs rows, newest first."""
    with db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT run_id, step_name, started_at, finished_at, status,
                       records_ingested, error_message
                FROM ingestion_runs
                ORDER BY started_at DESC
                LIMIT %s;
                """,
                (limit,),
            )
            return [dict(row) for row in cur.fetchall()]


def load_source_freshness() -> list[dict]:
    """Per-source row counts and most recent scrape/insert timestamps."""
    with db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT source_name,
                       MAX(date_scraped) AS latest_date_scraped,
                       MAX(created_at) AS latest_created_at,
                       COUNT(*) AS rows
                FROM fare_quotes
                GROUP BY source_name
                ORDER BY source_name;
                """
            )
            return [dict(row) for row in cur.fetchall()]


def load_row_counts() -> dict:
    """
    Row counts for all three tables in a single round trip.

    Three separate COUNT queries meant three round trips to a remote
    database, which dominated the System Health endpoint's response time.
    Scalar sub-selects collapse that into one.
    """
    with db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT (SELECT COUNT(*) FROM fare_quotes)        AS fare_quotes,
                       (SELECT COUNT(*) FROM cross_source_check) AS cross_source_check,
                       (SELECT COUNT(*) FROM ingestion_runs)     AS ingestion_runs;
                """
            )
            row = cur.fetchone()
    return {"fare_quotes": row[0], "cross_source_check": row[1], "ingestion_runs": row[2]}


def check_db_connectivity() -> bool:
    """
    Lightweight liveness check -- never raises, just reports True/False.

    Tries a pooled connection first, since that is the path every other query
    takes and it answers in milliseconds once the pool is warm. Only if that
    fails does it fall back to opening a direct short-timeout connection, so
    the check still gives a truthful answer when the pool itself is the thing
    that is broken.
    """
    try:
        with db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
        return True
    except Exception:
        pass

    try:
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=5)
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
            return True
        finally:
            conn.close()
    except Exception:
        return False
