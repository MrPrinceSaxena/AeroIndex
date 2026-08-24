# APIx — Real-time Airfare Price Index
### SIH 26056 | 6-person student team

A prototype index tracking domestic Indian airfare costs for 3 routes
(DEL-BOM, DEL-BLR, BOM-BLR) across 2 advance-purchase windows (T+7, T+30),
built from two independent data sources and designed for use by NSO/RBI.

**Read AGENTS.md for full project context, phase status, and known issues.**

---

## Setup (do this first)

```bash
# 1. Clone and enter the repo
git clone https://github.com/MrPrinceSaxena/AeroIndex.git
cd AeroIndex

# 2. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scriptsctivate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Install Playwright browser binaries
# This is a SEPARATE step — pip install alone does NOT download the browser
playwright install chromium

# 5. Set up your Supabase credentials
cp .env.example .env
# Edit .env and paste your Supabase DATABASE_URL

# 6. Initialize the database schema
python src/db/init_db.py
# Expected output: "Tables confirmed: ['cross_source_check', 'fare_quotes']" + "Connection OK"
```

---

## Running the project

```bash
# Run both scrapers + synthetic gap-filler + cross-source validation, and save
# everything to fare_quotes / cross_source_check (after verifying IndiGo robots.txt — see AGENTS.md)
python -m src.ingestion.run_all

# Run the cleaning pipeline
python src/cleaning/pipeline.py

# Optional: quick matplotlib sanity-check plot of the index
python -m src.index_engine.plot_sanity_check

# Start the dashboard
streamlit run dashboard/app.py

# Start the API (separate terminal)
uvicorn src.api.main:app --reload
# Visit http://localhost:8000/apix

# Run the test suite (cleaning, index engine, cross-source-check logic run
# offline against in-memory data — no database needed)
pytest tests/ -v
```

---

## Folder structure
See AGENTS.md for the full annotated folder tree.

## Data sources
- Source 1: Air India direct (airindia.com) — `air_india_direct`
- Source 2: IndiGo direct (goindigo.in) — `indigo_direct`
- Gap-filler: Synthetic generator calibrated to DGCA averages — `synthetic_estimate` (always labeled)

## Index formula
DGCA-traffic-weighted, chain-linked geometric mean. One formula, fully explained in `docs/methodology.md`.

## For the team
See [AGENTS.md](AGENTS.md) for: current phase, what is done, what is next, known issues.
Update AGENTS.md at the end of every work session.
