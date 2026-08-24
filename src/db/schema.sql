-- APIx Database Schema
-- Run via: python src/db/init_db.py
--
-- NOTE: gen_random_uuid() is a Postgres extension (pgcrypto / pg_catalog).
-- This schema is written for Supabase/Neon Postgres.
-- SQLite fallback: replace gen_random_uuid() with Python uuid.uuid4() in application code.
-- Supabase enables gen_random_uuid() by default via the pgcrypto extension.

-- ───────────────────────────────────────────────────────────────────────────────
-- ENABLE EXTENSION (Supabase has this on by default; uncomment if needed)
-- ───────────────────────────────────────────────────────────────────────────────
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ───────────────────────────────────────────────────────────────────────────────
-- TABLE: fare_quotes
-- Every single price record is traceable to exactly where it came from.
-- source_name is NOT a real/synthetic boolean -- it names the actual source
-- so that any number in the index can be audited back to its origin.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fare_quotes (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    route                 TEXT          NOT NULL
                            CHECK (route IN ('DEL-BOM', 'DEL-BLR', 'BOM-BLR')),
    carrier               TEXT,
    date_scraped          DATE          NOT NULL,
    travel_date           DATE          NOT NULL,
    advance_purchase_days INT           NOT NULL
                            CHECK (advance_purchase_days IN (7, 30)),
    fare_class            TEXT,
    -- NUMERIC(10,2): up to 8 digits before decimal, 2 after -- correct for INR fares
    base_fare             NUMERIC(10,2),
    taxes                 NUMERIC(10,2),
    total_fare            NUMERIC(10,2) NOT NULL,
    -- source_name values: 'air_india_direct', 'indigo_direct', 'synthetic_estimate'
    -- Adding a new source in Phase 1 = add one connector file + one new source_name value.
    source_name           TEXT          NOT NULL,
    is_sold_out           BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Index for the most common query pattern: get all quotes for a route + advance window
CREATE INDEX IF NOT EXISTS idx_fare_quotes_route_apd
    ON fare_quotes (route, advance_purchase_days, travel_date);

-- Index for filtering by source -- used in cross-source validation and dashboard
CREATE INDEX IF NOT EXISTS idx_fare_quotes_source
    ON fare_quotes (source_name, date_scraped);

-- ───────────────────────────────────────────────────────────────────────────────
-- TABLE: cross_source_check
-- Phase 1c: whenever Source 1 (air_india_direct) and Source 2 (indigo_direct)
-- both have a quote for the same route + travel_date + advance_purchase_days,
-- we log the % difference here.
-- This table IS our on-stage proof that the index is not an artifact of one site.
-- It feeds directly into the Methodology panel in Phase 5.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cross_source_check (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    route                 TEXT          NOT NULL
                            CHECK (route IN ('DEL-BOM', 'DEL-BLR', 'BOM-BLR')),
    travel_date           DATE          NOT NULL,
    advance_purchase_days INT           NOT NULL
                            CHECK (advance_purchase_days IN (7, 30)),
    source_a              TEXT          NOT NULL,
    source_b              TEXT          NOT NULL,
    price_a               NUMERIC(10,2) NOT NULL,
    price_b               NUMERIC(10,2) NOT NULL,
    -- pct_difference = ABS(price_a - price_b) / price_a * 100
    -- Sign convention: always positive (absolute deviation), never negative
    pct_difference        NUMERIC(6,2)  NOT NULL,
    checked_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cross_source_route_date
    ON cross_source_check (route, travel_date, advance_purchase_days);

-- ───────────────────────────────────────────────────────────────────────────────
-- TABLE: ingestion_runs
-- Every step of every `python -m src.ingestion.run_all` invocation logs one row
-- here -- this is what the System Health page reads to show real pipeline
-- history (last run, per-step success/failure, records ingested) instead of a
-- guess. run_id groups the steps that belong to one invocation together.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id                UUID          NOT NULL,
    step_name             TEXT          NOT NULL
                            CHECK (step_name IN (
                                'air_india_direct', 'indigo_direct',
                                'synthetic_gap_filler', 'cross_source_validation'
                            )),
    started_at            TIMESTAMPTZ   NOT NULL,
    finished_at           TIMESTAMPTZ,
    status                TEXT          NOT NULL CHECK (status IN ('success', 'failed')),
    records_ingested      INT           NOT NULL DEFAULT 0,
    error_message         TEXT,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started_at
    ON ingestion_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_run_id
    ON ingestion_runs (run_id);
