# APIx — Real-time Airfare Price Index

A prototype index tracking domestic Indian airfare costs for 3 routes
(DEL-BOM, DEL-BLR, BOM-BLR) across 2 advance-purchase windows (T+7, T+30),
built from two independent data sources and designed for use by NSO/RBI.

An 8-page React dashboard (Overview, Air Fare Index, Route Analytics, Data
Explorer, Data Quality, DGCA Benchmarking, Methodology, System Health) sits
on top of a FastAPI backend — every number on every page traces to a real
database-backed API call, nothing is hardcoded or simulated client-side.

**Read AGENTS.md for full project context, phase status, and known issues.**

---

## Setup (do this first)

```bash
# 1. Clone and enter the repo
git clone https://github.com/MrPrinceSaxena/AeroIndex.git
cd AeroIndex

# 2. Backend: create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 3. Install Playwright browser binaries
# This is a SEPARATE step — pip install alone does NOT download the browser
playwright install chromium

# 4. Set up your Supabase credentials
cp .env.example .env
# Edit .env and paste your Supabase DATABASE_URL

# 5. Initialize the database schema
python src/db/init_db.py
# Expected: "Tables confirmed: ['cross_source_check', 'fare_quotes', 'ingestion_runs']" + "Connection OK"

# 6. Frontend: install dependencies
cd frontend
npm install
cd ..
```

---

## Running the project

Two terminals, from the repo root:

```bash
# Terminal 1 — backend
source .venv/bin/activate
uvicorn src.api.main:app --reload
# Visit http://localhost:8000/apix, or http://localhost:8000/docs for the full API

# Terminal 2 — frontend
cd frontend
npm run dev
# Visit http://localhost:5173
```

To actually populate the database first:

```bash
# Run both scrapers + synthetic gap-filler + cross-source validation, and save
# everything to fare_quotes / cross_source_check (after verifying IndiGo robots.txt — see AGENTS.md)
python -m src.ingestion.run_all

# Run the cleaning pipeline
python src/cleaning/pipeline.py

# Optional: quick matplotlib sanity-check plot of the index
python -m src.index_engine.plot_sanity_check
```

Testing and quality gates:

```bash
# Backend: cleaning, index engine, analytics, data quality, backtest, and
# system-health logic all run offline against in-memory data — no DB needed
pytest tests/ -v

# Frontend
cd frontend
npx tsc -b       # typecheck
npm run lint     # oxlint
npm run build    # production build
```

See [docs/deployment.md](docs/deployment.md) for deploying the backend
(Render/Railway) and frontend (Vercel/Netlify) separately.

---

## Folder structure
See AGENTS.md for the full annotated folder tree.

## Data sources
- Source 1: Air India direct (airindia.com) — `air_india_direct`
- Source 2: IndiGo direct (goindigo.in) — `indigo_direct`
- Gap-filler: Synthetic generator calibrated to DGCA averages — `synthetic_estimate` (always labeled)

## Index formula
DGCA-traffic-weighted, chain-linked geometric mean. One formula, fully explained in `docs/methodology.md` and on the Methodology page.

## For the team
See [AGENTS.md](AGENTS.md) for: current phase, what is done, what is next, known issues.
Update AGENTS.md at the end of every work session.
