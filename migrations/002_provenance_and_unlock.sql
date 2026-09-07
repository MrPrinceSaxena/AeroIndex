-- APIx migration 002 — provenance, basket unlock, fee unbundling.
--
-- Three jobs: unlock the hardcoded basket, unbundle the fee components the PS
-- asks for, and make synthetic data structurally incapable of reaching the
-- published index or the backtest.
--
-- Run inside a transaction. Test against a restored dump before touching
-- the working DB:
--     psql "$DATABASE_URL" -f migrations/002_provenance_and_unlock.sql
--
-- This is the AUTHORITATIVE DDL. src/db/schema.sql mirrors the post-migration
-- consolidated state but is never run independently.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Unlock the basket. Routes and windows become data, not schema.
-- ---------------------------------------------------------------------------

ALTER TABLE fare_quotes DROP CONSTRAINT IF EXISTS fare_quotes_route_check;
ALTER TABLE fare_quotes DROP CONSTRAINT IF EXISTS fare_quotes_advance_purchase_days_check;

-- Also drop equivalent constraints on cross_source_check if they exist.
ALTER TABLE cross_source_check DROP CONSTRAINT IF EXISTS cross_source_check_route_check;
ALTER TABLE cross_source_check DROP CONSTRAINT IF EXISTS cross_source_check_advance_purchase_days_check;
ALTER TABLE ingestion_runs DROP CONSTRAINT IF EXISTS ingestion_runs_step_name_check;

CREATE TABLE IF NOT EXISTS route_basket (
    route                TEXT PRIMARY KEY,          -- 'DEL-BOM'
    origin_iata          CHAR(3) NOT NULL,
    destination_iata     CHAR(3) NOT NULL,
    is_active            BOOLEAN NOT NULL DEFAULT TRUE,
    dgca_pax_annual      BIGINT,                    -- source for index weights; NULL until real DGCA extract checked in
    dgca_source_citation TEXT,                      -- e.g. 'data/dgca/city_pair_fy24.csv sha256=abc123...'
    added_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (route = origin_iata || '-' || destination_iata)
);

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

-- ---------------------------------------------------------------------------
-- CRITICAL: Seed route_basket from existing fare_quotes BEFORE adding FKs.
-- Without this, the FK validation fails because route_basket is empty but
-- fare_quotes already contains rows with DEL-BOM, DEL-BLR, BOM-BLR.
-- dgca_pax_annual is deliberately left NULL — weights.py will refuse to
-- run until the team checks in a real DGCA extract with real numbers.
-- ---------------------------------------------------------------------------

INSERT INTO route_basket (route, origin_iata, destination_iata)
SELECT DISTINCT route, split_part(route, '-', 1), split_part(route, '-', 2)
FROM fare_quotes
ON CONFLICT (route) DO NOTHING;

-- Now add the foreign key constraints safely.
ALTER TABLE fare_quotes
    ADD CONSTRAINT fare_quotes_route_fk
    FOREIGN KEY (route) REFERENCES route_basket(route);

ALTER TABLE fare_quotes
    ADD CONSTRAINT fare_quotes_window_fk
    FOREIGN KEY (advance_purchase_days) REFERENCES advance_window(advance_purchase_days);

-- ---------------------------------------------------------------------------
-- 2. Fee unbundling. The PS asks for base fare, taxes, UDF and convenience
--    charges separately. NULL means "not disclosed by this source" — never
--    backfill these with a share-of-total estimate.
-- ---------------------------------------------------------------------------

ALTER TABLE fare_quotes
    ADD COLUMN IF NOT EXISTS yq_surcharge    NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS psf_fee         NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS udf_fee         NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS convenience_fee NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS gst             NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS is_cancelled    BOOLEAN NOT NULL DEFAULT FALSE;

-- ---------------------------------------------------------------------------
-- 3. Provenance. This is the fix for circular validation.
-- ---------------------------------------------------------------------------

ALTER TABLE fare_quotes
    ADD COLUMN IF NOT EXISTS data_origin TEXT NOT NULL DEFAULT 'imputed',
    ADD COLUMN IF NOT EXISTS channel     TEXT,
    ADD COLUMN IF NOT EXISTS provenance  JSONB;

-- Existing rows predate provenance tracking. They are synthetic by the audit's
-- own account, so they are labelled honestly rather than grandfathered in.
UPDATE fare_quotes SET data_origin = 'imputed' WHERE provenance IS NULL;

ALTER TABLE fare_quotes ALTER COLUMN data_origin DROP DEFAULT;

ALTER TABLE fare_quotes
    ADD CONSTRAINT fare_quotes_origin_check
    CHECK (data_origin IN ('observed', 'imputed'));

-- An observed row must be able to prove it. No provenance, no 'observed'.
ALTER TABLE fare_quotes
    ADD CONSTRAINT fare_quotes_observed_needs_evidence
    CHECK (
        data_origin <> 'observed'
        OR (provenance ? 'raw_sha256' AND provenance ? 'fetched_at' AND channel IS NOT NULL)
    );

CREATE INDEX IF NOT EXISTS idx_fare_quotes_origin ON fare_quotes (data_origin);
CREATE INDEX IF NOT EXISTS idx_fare_quotes_route_date
    ON fare_quotes (route, travel_date, advance_purchase_days);

-- ---------------------------------------------------------------------------
-- 4. The quarantine view. All index and backtest queries read from here.
--    Reading fare_quotes directly in index code is a review-blocking defect.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW observed_fare_quotes AS
    SELECT * FROM fare_quotes
    WHERE data_origin = 'observed'
      AND is_cancelled = FALSE;

COMMENT ON VIEW observed_fare_quotes IS
    'Only directly observed fares. The published index and the DGCA backtest MUST '
    'read from this view. Imputed rows are visible in the dashboard for coverage '
    'reporting only and must never enter index arithmetic or validation.';

-- ---------------------------------------------------------------------------
-- 5. Compliance audit trail.
-- ---------------------------------------------------------------------------

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

COMMIT;
