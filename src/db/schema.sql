-- APIx Database Schema — Post-migration 002 consolidated state
--
-- This file mirrors the result of running all migrations in order.
-- It is NOT run independently in production — use the migration files.
-- It serves as documentation and for fresh test database setup.
--
-- Run via: python src/db/init_db.py
--
-- NOTE: gen_random_uuid() is a Postgres extension (pgcrypto / pg_catalog).
-- Supabase enables gen_random_uuid() by default via the pgcrypto extension.

-- ───────────────────────────────────────────────────────────────────────────────
-- ENABLE EXTENSION (Supabase has this on by default; uncomment if needed)
-- ───────────────────────────────────────────────────────────────────────────────
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ───────────────────────────────────────────────────────────────────────────────
-- TABLE: route_basket — routes are data, not schema constraints
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS route_basket (
    route                TEXT PRIMARY KEY,          -- 'DEL-BOM'
    origin_iata          CHAR(3) NOT NULL,
    destination_iata     CHAR(3) NOT NULL,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    dgca_pax_annual      BIGINT,                    -- source for index weights
    dgca_source_citation TEXT,                      -- e.g. 'data/dgca/city_pair_fy24.csv sha256=abc...'
    added_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (route = origin_iata || '-' || destination_iata)
);

-- ───────────────────────────────────────────────────────────────────────────────
-- TABLE: advance_window — windows are data, not schema constraints
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS advance_window (
    advance_purchase_days INTEGER PRIMARY KEY CHECK (advance_purchase_days >= 0),
    label                 TEXT NOT NULL,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO advance_window (advance_purchase_days, label) VALUES
    (1,  'T+1 last-minute'),
    (7,  'T+7 short-lead'),
    (15, 'T+15 corporate'),
    (30, 'T+30 standard'),
    (45, 'T+45 vacation')
ON CONFLICT (advance_purchase_days) DO NOTHING;

-- ───────────────────────────────────────────────────────────────────────────────
-- TABLE: fare_quotes
-- Every single price record is traceable to exactly where it came from.
-- source_name is NOT a real/synthetic boolean -- it names the actual source
-- so that any number in the index can be audited back to its origin.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fare_quotes (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    route                 TEXT          NOT NULL
                            REFERENCES route_basket(route),
    carrier               TEXT,
    date_scraped          DATE          NOT NULL,
    travel_date           DATE          NOT NULL,
    advance_purchase_days INT           NOT NULL
                            REFERENCES advance_window(advance_purchase_days),
    fare_class            TEXT,
    -- NUMERIC(10,2): up to 8 digits before decimal, 2 after -- correct for INR fares
    base_fare             NUMERIC(10,2),
    taxes                 NUMERIC(10,2),
    total_fare            NUMERIC(10,2) NOT NULL,
    -- Fee unbundling (PS requirement). NULL means "not disclosed by this source" —
    -- never backfill with a share-of-total estimate.
    yq_surcharge          NUMERIC(10,2),
    psf_fee               NUMERIC(10,2),
    udf_fee               NUMERIC(10,2),
    convenience_fee       NUMERIC(10,2),
    gst                   NUMERIC(10,2),
    -- source_name values: 'air_india_direct', 'indigo_direct', 'synthetic_estimate', 'api:duffel', etc.
    source_name           TEXT          NOT NULL,
    is_sold_out           BOOLEAN       NOT NULL DEFAULT FALSE,
    is_cancelled          BOOLEAN       NOT NULL DEFAULT FALSE,
    -- Provenance: the fix for circular validation
    data_origin           TEXT          NOT NULL
                            CHECK (data_origin IN ('observed', 'imputed')),
    channel               TEXT,
    provenance            JSONB,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    -- An observed row must be able to prove it.
    CONSTRAINT fare_quotes_observed_needs_evidence CHECK (
        data_origin <> 'observed'
        OR (provenance ? 'raw_sha256' AND provenance ? 'fetched_at' AND channel IS NOT NULL)
    )
);

-- Index for the most common query pattern: get all quotes for a route + advance window
CREATE INDEX IF NOT EXISTS idx_fare_quotes_route_apd
    ON fare_quotes (route, advance_purchase_days, travel_date);

-- Index for filtering by source -- used in cross-source validation and dashboard
CREATE INDEX IF NOT EXISTS idx_fare_quotes_source
    ON fare_quotes (source_name, date_scraped);

-- Index for provenance quarantine
CREATE INDEX IF NOT EXISTS idx_fare_quotes_origin
    ON fare_quotes (data_origin);

CREATE INDEX IF NOT EXISTS idx_fare_quotes_route_date
    ON fare_quotes (route, travel_date, advance_purchase_days);

-- ───────────────────────────────────────────────────────────────────────────────
-- VIEW: observed_fare_quotes — the quarantine
-- All index and backtest queries MUST read from here, never from fare_quotes.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW observed_fare_quotes AS
    SELECT * FROM fare_quotes
    WHERE data_origin = 'observed'
      AND is_cancelled = FALSE;

COMMENT ON VIEW observed_fare_quotes IS
    'Only directly observed fares. The published index and the DGCA backtest MUST '
    'read from this view. Imputed rows are visible in the dashboard for coverage '
    'reporting only and must never enter index arithmetic or validation.';

-- ───────────────────────────────────────────────────────────────────────────────
-- TABLE: cross_source_check
-- Phase 1c: whenever two sources both have a quote for the same route +
-- travel_date + advance_purchase_days, we log the % difference here.
-- This table IS our on-stage proof that the index is not an artifact of one site.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cross_source_check (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    route                 TEXT          NOT NULL,
    travel_date           DATE          NOT NULL,
    advance_purchase_days INT           NOT NULL,
    source_a              TEXT          NOT NULL,
    source_b              TEXT          NOT NULL,
    price_a               NUMERIC(10,2) NOT NULL,
    price_b               NUMERIC(10,2) NOT NULL,
    -- pct_difference = ABS(price_a - price_b) / price_a * 100
    pct_difference        NUMERIC(6,2)  NOT NULL,
    checked_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cross_source_route_date
    ON cross_source_check (route, travel_date, advance_purchase_days);

-- ───────────────────────────────────────────────────────────────────────────────
-- TABLE: ingestion_runs
-- Every step of every ingestion invocation logs one row here.
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id                UUID          NOT NULL,
    step_name             TEXT          NOT NULL,
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

-- ───────────────────────────────────────────────────────────────────────────────
-- TABLE: robots_decisions — compliance audit trail
-- ───────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS robots_decisions (
    id                 BIGSERIAL PRIMARY KEY,
    decided_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    url                TEXT NOT NULL,
    user_agent         TEXT NOT NULL,
    allowed            BOOLEAN NOT NULL,
    reason             TEXT NOT NULL,
    matched_directive  TEXT,
    matched_group      TEXT,
    robots_url         TEXT NOT NULL,
    robots_sha256      TEXT,
    robots_fetched_at  TIMESTAMPTZ NOT NULL,
    crawl_delay        NUMERIC(6,2)
);

CREATE INDEX IF NOT EXISTS idx_robots_decisions_allowed
    ON robots_decisions (allowed, decided_at DESC);
