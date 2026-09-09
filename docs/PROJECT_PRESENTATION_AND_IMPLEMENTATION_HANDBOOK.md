# APIx (AeroIndex) — Project Master Handbook & Implementation Guide
> **Smart India Hackathon (SIH PS 26056)**  
> **Headline Objective:** Real-Time, High-Frequency Airfare Price Index and Market Intelligence Platform for India  
> **Institutional Stakeholders:** Ministry of Civil Aviation (MoCA), Ministry of Statistics & Programme Implementation (MoSPI / CPI), Reserve Bank of India (RBI), Directorate General of Civil Aviation (DGCA)

---

## 1. Executive Summary & Problem Context

### The Core Problem
In India, domestic airline pricing is dynamic and algorithms adjust fares multiple times per hour based on demand, booking lead time, and load factor. However:
1. **Statistical Lag:** Official inflation indices (MoSPI CPI) publish transport inflation monthly with a 2-4 week lag, relying on sampled survey quotes.
2. **Policy Blind Spots:** When airfares surge 300% during festival windows or regional disruptions, regulators lack high-frequency, route-weighted, verifiable indices to distinguish seasonal demand surges from anti-competitive cartelization.
3. **The Trap of Consumer Apps:** Consumer comparison sites (Google Flights, MakeMyTrip) search for cheap flight deals for individual travelers. They do not compute statistically sound, chain-linked, traffic-weighted economic price indices.

### The APIx Solution
**APIx** is an automated, high-frequency price index engine. It scrapes direct airline quotes, isolates them through a cryptographic provenance barrier, reconciles taxes and outlier anomalies, weights routes according to the official **DGCA Annual Passenger Traffic Survey**, and computes a **Jevons Geometric Mean Chain-Linked Price Index** (Base: 100 on 31 Aug 2026).

---

## 2. System Architecture & High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. INGESTION & EXTRACTION LAYER                                             │
│    • Air India Direct (Playwright headless Chromium)                        │
│    • IndiGo Direct (Playwright headless Chromium)                           │
│    • RFC 9309 robots.txt Compliance Gatekeeper                              │
│    • Synthetic Gap-Filler (Strictly quarantined fallback)                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 2. PROVENANCE GUARD & INTEGRITY BARRIER (Anti-Circularity Engine)            │
│    • Cryptographic Source Tagging (air_india_direct / indigo_direct)        │
│    • Quarantine Barrier: Synthetics can NEVER touch index calculation       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 3. CLEANING & RECONCILIATION PIPELINE                                       │
│    • Deduplication across identical scrape timestamps                       │
│    • Interquartile Range (IQR 1.5×) Statistical Outlier Flagging            │
│    • Base Fare + Taxes = Total Fare Arithmetic Reconciliation               │
│    • Sold-Out / Seat Exhaustion Tracking                                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 4. DGCA-WEIGHTED CHAIN-LINKED INDEX ENGINE                                   │
│    • Route Weights: DEL-BOM (43.8%), DEL-BLR (32.2%), BOM-BLR (24.0%)       │
│    • Advance Purchase Baskets: T+7 (Tactical) & T+30 (Strategic)             │
│    • Formula: Jevons Geometric Mean Chain-Linked Fixed-Basket Index          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 5. STORAGE & OBSERVABILITY (PostgreSQL Database)                            │
│    • Tables: fare_quotes, cross_source_check, ingestion_runs                │
│    • Automated Daily Scheduler (APScheduler @ 06:00 UTC)                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 6. FASTAPI BACKEND API (Port 8000)                                           │
│    • 11 REST Endpoints + Session Authentication + Dynamic Query Filtering   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│ 7. REACT 19 + TAILWIND v4 FRONTEND DASHBOARD                                │
│    • Standalone Futuristic Landing Page + 8 Policy Analytics Pages          │
│    • Light / Dark System Theme Engine + Interactive Corridor Radar          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step Implementation Guide (From Scratch)

If you need to explain how this was created from the ground up, here is the exact development sequence:

### Phase 1: Database Architecture (`src/db/schema.sql`)
We created a 3-table relational schema in PostgreSQL (hosted on Supabase) using strict `NUMERIC(10,2)` types for monetary figures:
1. `fare_quotes`: Stores every raw and cleaned quote with full provenance (`source_name`, `carrier`, `route`, `travel_date`, `advance_purchase_days`, `base_fare`, `taxes`, `total_fare`, `is_sold_out`).
2. `cross_source_check`: Stores paired comparisons between independent sources to prove market consistency and measure deviation percentage.
3. `ingestion_runs`: Observability audit log tracking each run ID, start time, end time, status, and records ingested.

### Phase 2: Web Scraping & Ingestion Engine (`src/ingestion/`)
1. **Pluggable Base Connector (`BaseConnector` ABC):** Defines a standard `scrape(route, travel_date, advance_days)` interface returning structured `FareRecord` dataclasses.
2. **Direct Airline Connectors:**
   - Air India Direct (`air_india_direct.py`)
   - IndiGo Direct (`indigo_direct.py`)
3. **Robots.txt Compliance Gate (`robots_gate.py`):** Complies with RFC 9309. It verifies that search result pages are permissive before opening browser connections, avoiding restricted aggregators (MakeMyTrip, EaseMyTrip, Ixigo).
4. **Automated Scheduler (`scheduler.py`):** Uses `APScheduler` configured with an `AsyncIOScheduler` to trigger daily extraction jobs at `06:00 UTC` and log results to `ingestion_runs`.

### Phase 3: Provenance & Anti-Circularity Guard (`src/validation/provenance_guard.py`)
* **The Fatal Trap Avoided:** If synthetic data is calibrated on DGCA averages, and then used to compute an index, and that index is "validated" against DGCA averages, it is a circular tautology.
* **The Fix:** The `ProvenanceGuard` enforces a hard barrier. Only `air_india_direct` and `indigo_direct` are ever permitted into index calculation. Synthetic estimates are strictly quarantined for missing baseline pairs and visually badged with amber tags.

### Phase 4: Data Cleaning & Normalization (`src/cleaning/pipeline.py`)
Four deterministic cleaning stages execute on incoming data:
1. `deduplicate_quotes`: Keeps the latest quote per (route, carrier, travel_date, advance_window, source).
2. `flag_outliers_iqr`: Computes the 25th percentile ($Q_1$) and 75th percentile ($Q_3$). Any fare outside $[Q_1 - 1.5 \times \text{IQR}, Q_3 + 1.5 \times \text{IQR}]$ is flagged as an anomaly.
3. `reconcile_fares`: Validates that $\text{base\_fare} + \text{taxes} = \text{total\_fare}$. If base fare is missing, it reconstructs it using standard airline tax schedules.
4. `filter_usable_quotes`: Excludes sold-out flights from price averaging while tracking load exhaustion rates.

### Phase 5: Index Calculation Engine (`src/index_engine/compute_index.py`)
* **Why Geometric Mean (Jevons Formula):** Arithmetic averages (Dutot) suffer from high-price upward bias when premium carriers surge. Jevons geometric mean satisfies axiomatic properties: time-reversal test, transitivity, and unit independence.
* **Weights Formula (`weights.py`):** Derived from DGCA Annual Domestic Passenger Volume:
  - $\text{DEL-BOM} = 43.8\%$
  - $\text{DEL-BLR} = 32.2\%$
  - $\text{BOM-BLR} = 24.0\%$
* **Chain-Linking:** Daily price relatives are multiplied cumulatively ($I_t = I_{t-1} \times R_t$) to prevent base-period drift.

### Phase 6: REST API Backend (`src/api/main.py`)
Built with **FastAPI** using asynchronous connection pools:
* `GET /apix`: Latest index series, chain-linked values, and data coverage.
* `GET /apix/heatmap`: Route $\times$ Advance Window (T+7 vs T+30) fare matrix.
* `GET /apix/elasticity`: Surge premium between T+30 booking and T+7 tactical booking.
* `GET /apix/route-history`: Per-route fare trajectory over time.
* `GET /apix/contributions`: Mathematical contribution of each corridor to the total index.
* `GET /apix/data-quality`: Outlier metrics, mismatch rates, and confidence score.
* `GET /apix/backtest`: Comparison of APIx monthly geometric averages against published DGCA reference fares.
* `GET /apix/quotes`: Paginated, multi-parameter raw fare table with search and filtering.
* `GET /system/health`: DB connectivity, scheduled jobs, and pipeline run logs.
* `POST /system/scheduler/trigger`: Manual on-demand pipeline trigger.
* `/auth/*`: Institutional session authentication with pre-configured official personas (MoSPI, RBI, MoCA).

### Phase 7: Frontend Application (`frontend/`)
Built with **React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, and TanStack React Query**:
* **Landing Page (`/`):** Cinematic aviation intelligence portal with interactive 3D corridor radar, live floating trend card (`DEL → BOM ₹6,230`), and 6-stage pipeline walkthrough.
* **8 Analytic Pages:**
  1. *Overview:* Executive KPI cards, latest index reading, headline auto-summary.
  2. *Air Fare Index:* Main index chart, base-100 timeline, route $\times$ window heatmap.
  3. *Route Analytics:* Route-level breakdown, elasticity curves, lead-time surge factors.
  4. *Data Explorer:* Full searchable ledger of raw scraped quotes with source badges.
  5. *Data Quality:* Outlier sanitization statistics, reconciliation metrics, confidence score.
  6. *DGCA Benchmarking:* Backtesting APIx against DGCA published monthly reference fares.
  7. *Methodology:* Transparent mathematical formulas, Jevons equations, and weight citations.
  8. *System Health:* Live telemetry, scheduler status, database ping, and trigger button.

---

## 4. How to Run & Verify the Project

### 1. Prerequisites
* Python 3.10+ (Python 3.12 recommended)
* Node.js 18+ (Node 20+ recommended)
* Chromium Playwright dependencies

### 2. Quick Setup Commands
```bash
# Clone the repository
git clone https://github.com/MrPrinceSaxena/AeroIndex.git
cd AeroIndex

# Setup Python Virtual Environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium

# Setup Frontend Dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Variables (`.env`)
Ensure your `.env` file contains:
```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
ENABLE_SCHEDULER=true
SCHEDULE_CRON_HOUR=6
SCHEDULE_CRON_MINUTE=0
```

### 4. Running the Project
Open two terminal tabs:

**Terminal 1 (Backend API):**
```bash
source .venv/bin/activate
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 (Frontend UI):**
```bash
cd frontend
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Running Automated Verification Tests
```bash
source .venv/bin/activate
pytest
```
*Expected result:* **155/155 passed (100% pass rate).**

---

## 5. Evaluator Defense & Presentation Cheat-Sheet

When presenting to Smart India Hackathon evaluators or domain experts from MoCA/MoSPI/DGCA, use these exact talking points:

### 1. "Why only 3 routes in the prototype?"
> **Answer:** "DEL-BOM, DEL-BLR, and BOM-BLR account for over 50% of metro passenger traffic in India. Demonstrating end-to-end data integrity, outlier sanitization, and mathematical chain-linking on these three high-density corridors proves the architecture. The connector model is pluggable: scaling to 50 routes is simply a matter of adding airport IATA pairs in `weights.py`."

### 2. "Why did you scrape airlines directly rather than MakeMyTrip or Google Flights?"
> **Answer:** "Under RFC 9309, all major OTA aggregators (MakeMyTrip, EaseMyTrip, Ixigo) explicitly disallow automated scraping on their flight search endpoints (`Disallow: /flight-search/*`). Airline direct websites permit search access under standard robot policies. For a Government of India statistical project, legal compliance and data provenance are non-negotiable."

### 3. "Why use Jevons Geometric Mean instead of simple average?"
> **Answer:** "Simple arithmetic averages (Laspeyres/Dutot) are vulnerable to extreme outliers and price scale distortions when business class or emergency tickets surge. The Jevons Geometric Mean ($I_t = \prod (P_t / P_0)^w$) satisfies the time-reversal and transitivity tests, matching IMF and ILO Consumer Price Index manual guidelines."

### 4. "How do you ensure you aren't showing fake or simulated data?"
> **Answer:** "Every number displayed in the dashboard is retrieved via parameterized SQL queries from our PostgreSQL database. We built a strict `ProvenanceGuard`: real quotes are tagged as `air_india_direct` or `indigo_direct`. Synthetic values are strictly quarantined and visually tagged in amber, ensuring no synthetic data ever pollutes index computation."

---

## 6. Project Directory Map

```
apix-prototype/
├── docs/                                # Documentation & Evidence Dossiers
│   ├── PROJECT_PRESENTATION_AND_HANDBOOK.md
│   ├── EVIDENCE_AND_DIFFERENTIATION_DOSSIER.md
│   ├── methodology.md
│   └── deployment.md
├── src/
│   ├── api/                             # FastAPI Backend & REST Endpoints
│   │   ├── main.py                      # Main App & Router
│   │   ├── analytics.py                 # Heatmap, Elasticity, Contributions
│   │   ├── data_quality.py              # Outlier & Reconciliation Aggregators
│   │   ├── quotes.py                    # Filtered Quote Query Builder
│   │   └── system_health.py             # Telemetry & Status Computation
│   ├── cleaning/                        # Data Cleaning & Outlier Filters
│   │   └── pipeline.py
│   ├── db/                              # Database Schema & Connection Pool
│   │   ├── schema.sql
│   │   └── init_db.py
│   ├── index_engine/                    # DGCA Weighted Jevons Index Engine
│   │   ├── compute_index.py
│   │   └── weights.py
│   ├── ingestion/                       # Scraping & Scheduler Layer
│   │   ├── connectors/                  # Air India & IndiGo Playwright Scrapers
│   │   ├── scheduler.py                 # Daily Background Worker
│   │   ├── run_all.py                   # Master Extraction Pipeline Orchestrator
│   │   └── db_writer.py                 # Database Persistence Handler
│   └── validation/                      # Provenance Barrier & Cross-Validation
│       ├── provenance_guard.py
│       └── cross_source_check.py
├── frontend/                            # React 19 + Vite + Tailwind v4 Dashboard
│   ├── src/
│   │   ├── components/                  # Chart, Map, Table, and Layout Components
│   │   ├── context/                     # Authentication Context & Personas
│   │   ├── pages/                       # 8 Analytics Pages + Landing Page
│   │   └── api/                         # Typed Fetch Client
│   └── package.json
├── tests/                               # 155 Unit & Integration Tests (100% Pass)
├── requirements.txt                     # Backend Dependencies
├── Procfile                             # Cloud Deployment Start Command
└── pytest.ini                           # Pytest Test Runner Configuration
```
