# AGENTS.md — Persistent Project Memory
### READ THIS FIRST. UPDATE THIS LAST. Every session, no exceptions.

---

## Goal

A prototype Real-time Airfare Price Index (APIx) for 3 routes (DEL-BOM, DEL-BLR,
BOM-BLR) and 2 advance-purchase windows (T+7, T+30), built from **two independent
scraped sources** (Air India direct + IndiGo direct) plus a clearly-labelled synthetic
gap-filler, cleaned into a structured schema, turned into **one** DGCA-traffic-weighted
chain-linked index using a single defensible formula, backtested against DGCA published
average fares, and served through a Streamlit dashboard + FastAPI JSON endpoint that
surfaces **methodology, not just a number** — framed throughout as infrastructure for
NSO/RBI, not a consumer flight-deal app.

Problem statement: SIH 26056 | Team size: 6 | Event: Smart India Hackathon

---

## The Five Risks We Are Building Against
*(Keep this visible — no session should drift into just making it pretty)*

| Risk | Why judges challenge it | Where it is handled |
|---|---|---|
| Scraping only one airline | Is this representative of the Indian market? | Phase 1 — two independent airline-direct sources, pluggable connectors |
| Synthetic data dominating the demo | Is this actually real? | Phase 1b — synthetic is a gap-filler ONLY, always tagged, never blended silently |
| Arbitrary weights | Why should we trust your index? | Phase 3 + Phase 5 — weights from DGCA Annual Traffic Survey, shown on-screen |
| Overcomplicated maths | Why is this necessary? | Phase 3 — ONE formula, chosen and justified in plain English; extras are bonus-only |
| Pretty dashboard, no policy value | So what can government actually do with it? | Phase 5 — Methodology panel + What this means panel are MANDATORY |

---

## Tech Stack (Locked — do not change mid-sprint)

| Layer | Choice | Reason |
|---|---|---|
| Ingestion | Python + Playwright; Air India direct (Source 1) + IndiGo direct (Source 2) | Both robots.txt checked — flight search pages not disallowed. All major OTAs (Ixigo, EaseMyTrip, Cleartrip) explicitly disallow flight search result pages for all bots — two airline-direct sources is the honest and defensible choice |
| Storage | Supabase free Postgres (PRIMARY); SQLite as local fallback for offline dev | SQLite fallback: schema.sql uses gen_random_uuid() which is Postgres-only — see Known Issues |
| Cleaning | Pandas + NumPy | Fast to write, judges will not question it |
| Index engine | Pandas + NumPy; ONE formula: DGCA-traffic-weighted, chain-linked fixed-basket | One formula explained beats two formulas that cannot be defended under questioning |
| Dashboard | Streamlit | Working demo in hours; no time for React at hackathon pace |
| API | FastAPI | Returns index + methodology metadata — not just a bare number |
| Hosting | Streamlit Community Cloud (dashboard) + Render free tier (API) | Zero-cost |

---

## Data Schema (Locked — everything downstream depends on this)

```sql
-- fare_quotes: every price traceable to exactly where it came from
-- NUMERIC(10,2) for all fare columns — self-documenting for INR currency
CREATE TABLE fare_quotes (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route                 TEXT          NOT NULL,  -- DEL-BOM, DEL-BLR, BOM-BLR
    carrier               TEXT,
    date_scraped          DATE          NOT NULL,
    travel_date           DATE          NOT NULL,
    advance_purchase_days INT           NOT NULL,  -- 7 or 30
    fare_class            TEXT,
    base_fare             NUMERIC(10,2),
    taxes                 NUMERIC(10,2),
    total_fare            NUMERIC(10,2) NOT NULL,
    source_name           TEXT          NOT NULL,  -- air_india_direct, indigo_direct,
                                                   -- or synthetic_estimate
                                                   -- NOT just a real/synthetic flag
    is_sold_out           BOOLEAN       DEFAULT FALSE
);

-- cross_source_check: not a fluke of one site proof — surface in Methodology panel
CREATE TABLE cross_source_check (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route                 TEXT          NOT NULL,
    travel_date           DATE          NOT NULL,
    advance_purchase_days INT           NOT NULL,
    source_a              TEXT          NOT NULL,
    source_b              TEXT          NOT NULL,
    price_a               NUMERIC(10,2) NOT NULL,
    price_b               NUMERIC(10,2) NOT NULL,
    pct_difference        NUMERIC(6,2)  NOT NULL  -- shown in Methodology panel
);
```

---

## Robots.txt Compliance Log
*(Checked 2026-08-24 — re-check if Phase 1 build is delayed more than a week)*

| Site | robots.txt status | Flight search pages | Decision |
|---|---|---|---|
| airindia.com | Readable | NOT disallowed for * | Source 1: air_india_direct |
| goindigo.in | Server error on fetch | Unknown | Source 2: indigo_direct — must recheck manually before scraping |
| ixigo.com | Readable | /flights/search DISALLOWED | Excluded |
| easemytrip.com | Readable | /flight-search/listing* DISALLOWED | Excluded |
| cleartrip.com | Readable | /flights/search* DISALLOWED | Excluded |

Action for Phase 1: Before running IndiGo connector, manually visit
https://www.goindigo.in/robots.txt in a browser and confirm it is readable.
Log the result in Known Issues below.

---

## Folder Structure

```
apix-prototype/
├── AGENTS.md                        # THIS FILE — read first, update last
├── README.md
├── .env                             # NOT committed — holds DATABASE_URL
├── .env.example                     # committed — template only
├── requirements.txt
├── data/
│   ├── raw/
│   │   ├── airline_direct/          # Air India raw output
│   │   └── ota/                     # IndiGo raw output (named ota for pluggability)
│   ├── synthetic/                   # gap-filler data — always separate
│   └── clean/                       # post-cleaning pipeline output
├── src/
│   ├── db/
│   │   ├── schema.sql
│   │   └── init_db.py
│   ├── ingestion/
│   │   ├── connectors/
│   │   │   ├── __init__.py          # BaseConnector ABC — pluggable interface
│   │   │   ├── air_india_direct.py  # Source 1
│   │   │   └── indigo_direct.py     # Source 2
│   │   └── synthetic_generator.py   # gap-filler only
│   ├── validation/
│   │   └── cross_source_check.py    # Phase 1c
│   ├── cleaning/
│   │   └── pipeline.py
│   ├── index_engine/
│   │   ├── weights.py
│   │   └── compute_index.py
│   ├── backtest/
│   │   └── compare_dgca.py
│   └── api/
│       └── main.py
├── dashboard/
│   └── app.py
├── tests/
└── docs/
    ├── methodology.md
    └── compliance.md
```

---

## Phase Log

### Phase 0 — Setup — DONE (2026-08-24)
- Repo scaffolded at /Users/sushilkohli/Downloads/SIH/apix-prototype/
- Database: Supabase Postgres (team must paste DATABASE_URL into .env)
- Source 1: Air India direct (air_india_direct) — robots.txt confirmed permissive
- Source 2: IndiGo direct (indigo_direct) — robots.txt unconfirmed (server error on fetch); must manually verify before Phase 1 scraping
- OTAs excluded: Ixigo, EaseMyTrip, Cleartrip all explicitly disallow flight search for all bots
- Schema: fare_quotes + cross_source_check — both tables with NUMERIC(10,2) fare columns
- DGCA weights and backtest data: using DGCA Annual Traffic Survey defaults (cited in code)
- Playwright install: pip install playwright + playwright install chromium — documented in README
- Key decisions locked: Streamlit (not React), one index formula (DGCA-weighted chain-linked), Supabase
- Git: repo initialized locally (2026-08-24), pushed to GitHub (2026-08-24) — see repo URL below

### Phase 1 + 1b + 1c — Ingestion, gap-filler, cross-validation — CODE COMPLETE, UNVERIFIED LIVE (2026-08-24)
- Source 1 (air_india_direct.py) and Source 2 (indigo_direct.py): Playwright connector
  classes exist, following the shared BaseConnector interface. Fare-card CSS selectors
  are still TODO placeholders — must be confirmed against the live sites before a real
  scrape, per the module docstrings.
- Pluggable BaseConnector ABC + FareRecord dataclass: done (src/ingestion/connectors/__init__.py)
- Synthetic gap-filler (synthetic_generator.py): done, calibrated to DGCA FY2023-24 averages
  (DEL-BOM ₹5,800 / DEL-BLR ₹5,200 / BOM-BLR ₹4,600), only fills route/date/window
  combinations missing from real data
- Cross-source validation (cross_source_check.py): done — compute + save + summary functions
- **NEW (this session): src/ingestion/db_writer.py** — this was the missing link. Connectors
  and the synthetic generator returned FareRecord objects but nothing ever wrote them to
  fare_quotes. save_fare_records() closes that gap.
- **NEW (this session): src/ingestion/run_all.py** — single entry point
  (`python -m src.ingestion.run_all`) that runs both connectors, gap-fills, persists to
  fare_quotes, then runs + persists cross-source validation. This is what README.md
  already referenced but didn't exist until now.
- NOT YET DONE: nobody has run this against a live Supabase instance or the real airline
  sites — no DATABASE_URL is configured in this environment. Treat selectors + live DB
  write path as unverified until a teammate with Supabase credentials runs it end to end.
- NEXT: get a Supabase project set up, paste DATABASE_URL into .env, manually inspect
  airindia.com / goindigo.in fare-result markup and fix the TODO selectors, then run
  `python -m src.ingestion.run_all`.

### Phase 2 — Cleaning pipeline — CODE COMPLETE (2026-08-24)
- dedupe, IQR outlier flagging, base+tax/total reconciliation, sold-out handling all
  implemented in src/cleaning/pipeline.py; source_name invariant enforced with a hard check
- Covered by offline unit tests (tests/test_cleaning.py) — no DB required to verify logic
- docs/methodology.md documents each rule in plain language

### Phase 3 — Index engine — CODE COMPLETE (2026-08-24)
- DGCA-traffic-weighted, chain-linked geometric-mean index in src/index_engine/compute_index.py
- Weights locked in src/index_engine/weights.py (DEL-BOM 43.8% / DEL-BLR 32.2% / BOM-BLR 24.0%)
- **NEW (this session): src/index_engine/plot_sanity_check.py** — the matplotlib sanity-check
  plot called for in the blueprint (writes data/clean/apix_sanity_check.png)
- Covered by offline unit tests (tests/test_index_engine.py)

### Phase 4 — Backtest — CODE COMPLETE, REFERENCE DATA PARTIAL (2026-08-24)
- src/backtest/compare_dgca.py compares monthly APIx averages against DGCA reference fares
- DGCA_REFERENCE only has 3 months (2023-04 through 2023-06) hardcoded as placeholders —
  TODO in the file: extend with real figures from DGCA Traffic and Fare Monitor PDFs
  before the backtest is presentation-ready
- 15% deviation threshold flags (not hides) large discrepancies, per blueprint

### Phase 5 — Dashboard + API — CODE COMPLETE, UNVERIFIED LIVE (2026-08-24)
- FastAPI /apix endpoint (src/api/main.py) returns index + methodology metadata
  (weights, sources, cross-source validation stats) — imports cleanly, not yet run
  against a live DB
- Streamlit dashboard (dashboard/app.py): trend line with real-vs-estimated dashed/amber
  styling, route heatmap, lead-time elasticity chart, Methodology panel, "what this means"
  auto-generated sentence — all present
- Fixed this session: a broken/truncated st.info() hint string that referenced connectors
  without saying how to run them
- NOT YET DONE: nobody has loaded either app against real data — needs Supabase +
  Phase 1 run first

### Phase 6 — Polish — NOT STARTED
- NEXT: once Phase 1 has run against live data at least once, do a full run-through,
  rehearse the five judge-risk answers (Section 1 of the blueprint), write the demo script

---

## Known Issues / Fragile Parts
*(Running list — update every session)*

1. IndiGo robots.txt unverified — goindigo.in returned a server error when fetched
   programmatically. Must open https://www.goindigo.in/robots.txt in a browser and confirm
   before running the connector. If it disallows scraping, fallback: SpiceJet (not yet checked).
2. SQLite fallback incompatibility — gen_random_uuid() is Postgres-only. If using SQLite,
   use Python uuid.uuid4() for inserts instead of relying on DB default. No SQLite code path
   actually exists yet — this is Postgres-only today despite being mentioned as a fallback.
3. Supabase credentials — team must create a Supabase project and paste DATABASE_URL into
   .env before init_db.py will work. Never commit .env. No live DB has been used to verify
   anything in this repo yet — all verification so far is either static (syntax/import
   checks) or offline unit tests against in-memory DataFrames.
4. Connector CSS selectors are still TODO placeholders in both air_india_direct.py and
   indigo_direct.py — confirmed by inspecting the live page structure manually before
   the first real scrape run.
5. DGCA_REFERENCE in src/backtest/compare_dgca.py only covers 3 months of placeholder
   data — needs real figures from the DGCA Traffic and Fare Monitor reports.
6. GitHub repo URL — fill in below once pushed:
   GitHub repo: https://github.com/MrPrinceSaxena/AeroIndex

## Fixed this session (2026-08-24)
- src/db/init_db.py had an actual Python syntax error (unterminated string literal from a
  literal newline inside a plain string) — the DB init script could not run at all. Fixed.
- No code anywhere wrote FareRecord objects into fare_quotes — connectors and the synthetic
  generator produced records that went nowhere. Added src/ingestion/db_writer.py.
- README.md referenced `python -m src.ingestion.run_all`, which didn't exist. Added it.
- dashboard/app.py had a broken/truncated hint string ("Tip:  then run the connectors.").
  Fixed.
- Added offline unit tests (25 new tests) for cleaning, index-engine, and cross-source-check
  logic that don't require a live database — all 34 tests in tests/ pass.
