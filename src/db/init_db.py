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

            # Verify both tables exist
            cur.execute(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_name IN ('fare_quotes', 'cross_source_check')
                ORDER BY table_name;
                """
            )
            tables = [row[0] for row in cur.fetchall()]
            print(f"Tables confirmed in database: {tables}")

            if set(tables) == {"fare_quotes", "cross_source_check"}:
                print("Connection OK — Phase 0 complete.")
            else:
                missing = {"fare_quotes", "cross_source_check"} - set(tables)
                print(f"WARNING: missing tables: {missing}", file=sys.stderr)
    finally:
        conn.close()


if __name__ == "__main__":
    init_db()
