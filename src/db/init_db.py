"""
src/db/init_db.py

Runs schema.sql against the configured Postgres database.
Prints a confirmation so the team can verify the connection works.

Usage:
    python src/db/init_db.py

Requires:
    DATABASE_URL in .env (copy from .env.example and fill in Supabase credentials)

SQLite note:
    This script targets Postgres only. gen_random_uuid() will fail on SQLite.
    For local dev without Supabase, set up a free Supabase or Neon project instead.
"""

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
import psycopg2

# Load .env from repo root (two levels up from this file)
REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print(
        "ERROR: DATABASE_URL not set.\n"
        "Copy .env.example to .env and fill in your Supabase connection string.",
        file=sys.stderr,
    )
    sys.exit(1)

SCHEMA_PATH = Path(__file__).parent / "schema.sql"


def init_db() -> None:
    """Create tables if they do not already exist."""
    schema_sql = SCHEMA_PATH.read_text(encoding="utf-8")

    conn = psycopg2.connect(DATABASE_URL)
    try:
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(schema_sql)
            print("Schema applied successfully.")

            # Verify all tables exist (post-migration 002 state)
            expected_tables = {
                "fare_quotes", "cross_source_check", "ingestion_runs",
                "route_basket", "advance_window", "robots_decisions",
            }
            cur.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name IN (
                      'fare_quotes', 'cross_source_check', 'ingestion_runs',
                      'route_basket', 'advance_window', 'robots_decisions'
                  )
                ORDER BY table_name;
                """
            )
            tables = [row[0] for row in cur.fetchall()]
            print(f"Tables confirmed in database: {tables}")

            # Verify the quarantine view exists
            cur.execute("""
                SELECT table_name FROM information_schema.views
                WHERE table_schema = 'public' AND table_name = 'observed_fare_quotes';
            """)
            view_exists = bool(cur.fetchone())
            if view_exists:
                print("View confirmed: observed_fare_quotes")
            else:
                print("WARNING: observed_fare_quotes view missing", file=sys.stderr)

            if set(tables) == expected_tables and view_exists:
                print("Connection OK — schema is up to date.")
            else:
                missing = expected_tables - set(tables)
                if missing:
                    print(f"WARNING: missing tables: {missing}", file=sys.stderr)
                if not view_exists:
                    print("Run: psql \"$DATABASE_URL\" -f migrations/002_provenance_and_unlock.sql",
                          file=sys.stderr)
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()
