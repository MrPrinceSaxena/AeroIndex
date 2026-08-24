"""
src/db/connection.py

A shared connection pool for the whole application.

Why this exists: every query used to open its own psycopg2 connection to a
remote Supabase instance and tear it down again. TLS handshake plus
round-trip latency meant a single request could take several seconds, and a
dashboard page that calls four endpoints paid that cost four times over.
Pooling reuses established connections, which is the difference between a
page that feels instant and one that visibly stalls.

Usage:
    from src.db.connection import db_cursor, db_connection

    with db_cursor() as cur:          # autocommit-style reads
        cur.execute("SELECT 1")

    with db_connection() as conn:     # when you need conn.commit() yourself
        ...
"""

import os
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
import psycopg2
from psycopg2 import pool as pg_pool

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

DATABASE_URL = os.getenv("DATABASE_URL")

_pool: Optional[pg_pool.ThreadedConnectionPool] = None
_pool_lock = threading.Lock()


def get_pool() -> pg_pool.ThreadedConnectionPool:
    """Lazily create the pool so importing this module never opens a socket."""
    global _pool
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                if not DATABASE_URL:
                    raise RuntimeError("DATABASE_URL is not set — copy .env.example to .env and fill it in.")
                _pool = pg_pool.ThreadedConnectionPool(minconn=1, maxconn=8, dsn=DATABASE_URL)
    return _pool


@contextmanager
def db_connection():
    """
    Borrow a pooled connection and always return it, even on error. A
    connection that failed is closed rather than handed back poisoned.
    """
    pool_ = get_pool()
    conn = pool_.getconn()
    try:
        yield conn
    except Exception:
        # Roll back so the next borrower never inherits an aborted transaction.
        try:
            conn.rollback()
        except psycopg2.Error:
            pass
        raise
    finally:
        pool_.putconn(conn)


@contextmanager
def db_cursor(commit: bool = False):
    """Borrow a connection and hand back a cursor, committing if asked."""
    with db_connection() as conn:
        with conn.cursor() as cur:
            yield cur
        if commit:
            conn.commit()


def close_pool() -> None:
    """Close every pooled connection — used on application shutdown."""
    global _pool
    if _pool is not None:
        _pool.closeall()
        _pool = None
