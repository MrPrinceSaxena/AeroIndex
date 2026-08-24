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
    conn = psycopg2.connect(DATABASE_URL)
    try:
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
    finally:
        conn.close()


def load_recent_runs(limit: int = 20) -> list[dict]:
    """Most recent ingestion_runs rows, newest first."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
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
    finally:
        conn.close()


def load_source_freshness() -> list[dict]:
    """Per-source row counts and most recent scrape/insert timestamps."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
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
    finally:
        conn.close()


def load_row_counts() -> dict:
    """Row counts for all three tables -- used in the System Health overview."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            counts = {}
            for table in ("fare_quotes", "cross_source_check", "ingestion_runs"):
                cur.execute(f"SELECT COUNT(*) FROM {table};")
                counts[table] = cur.fetchone()[0]
            return counts
    finally:
        conn.close()


def check_db_connectivity() -> bool:
    """Lightweight liveness check -- never raises, just reports True/False."""
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
