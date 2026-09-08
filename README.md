# ✈️ AeroIndex (APIx) — Real-Time Airfare Price Index

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791.svg?logo=postgresql&logoColor=white)](https://supabase.com)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium-2EAD33.svg?logo=playwright&logoColor=white)](https://playwright.dev)
[![Pytest Suite](https://img.shields.io/badge/Tests-145%20Passed-brightgreen.svg?logo=pytest&logoColor=white)](https://pytest.org)

> **Real-Time Economic Infrastructure for High-Frequency Airfare Inflation Tracking**  
> *Built for the National Statistical Office (NSO), Reserve Bank of India (RBI), and Ministry of Civil Aviation (MoCA).*  
> **Problem Statement**: SIH 26056 | **Smart India Hackathon**

---

## 📑 Table of Contents
- [Executive Overview](#-executive-overview)
- [The Problem with the Status Quo](#-the-problem-with-the-status-quo)
- [System Architecture & End-to-End Workflow](#-system-architecture--end-to-end-workflow)
- [Tech Stack](#-tech-stack)
- [Mathematical Methodology](#-mathematical-methodology)
- [The 8-Page SaaS Dashboard](#-the-8-page-saas-dashboard)
- [Data Integrity & Compliance (RobotsGate & Provenance)](#-data-integrity--compliance-robotsgate--provenance)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Deployment Guide](#-deployment-guide)
- [Academic & Institutional References](#-academic--institutional-references)

---

## 🎯 Executive Overview

**AeroIndex (APIx)** is an automated, high-frequency price index engine and analytics platform designed to measure domestic airfare inflation in India. 

Unlike traditional consumer price indices that rely on delayed manual surveys, AeroIndex:
1. **Ingests live daily fare quotes** directly from major Indian carrier endpoints (Air India, IndiGo) via headless browser automation.
2. **Controls for dynamic yield management** by stratifying quotes into distinct advance-purchase cohorts (**$T+7$** short-lead and **$T+30$** advance planning).
3. **Applies verifiable DGCA passenger traffic weights** to ensure busy corridors (like Delhi–Mumbai) proportionately influence the index.
4. **Calculates a chained geometric-mean index** ($I_t$, base = 100.0) that eliminates substitution bias and prevents baseline drift.
5. **Provides cryptographic auditability** using SHA-256 quote provenance stored in Supabase PostgreSQL, surfaced across an enterprise-grade 8-page React 19 dashboard.

---

## ⚠️ The Problem with the Status Quo

Traditional government inflation measurement frameworks (e.g. MoSPI/NSO CPI) face four critical failures when applied to civil aviation:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   TRADITIONAL CPI FAILURES                                  │
├──────────────────────────────┬──────────────────────────────────────────────────────────────┤
│ 1. 45+ Day Publication Lag   │ Monthly physical agent surveys publish results 4–8 weeks     │
│                              │ late, rendering data useless for real-time monetary policy.  │
├──────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 2. Dynamic Pricing Blindspot │ Airline algorithms update seat prices thousands of times     │
│                              │ daily; static single-day snapshots miss all mid-month swings.│
├──────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 3. Booking Horizon Mix Bias  │ Mixing last-minute tickets ($T+1$) with early-bird bookings   │
│                              │ ($T+30$) creates artificial volatility of up to 300%.        │
├──────────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 4. Upward Substitution Bias  │ Fixed-base Laspeyres formulas fail when passengers switch to │
│                              │ cheaper dates/carriers, overstating inflation by ~1.5%/year. │
└──────────────────────────────┴──────────────────────────────────────────────────────────────┘
```

**AeroIndex Solves This By:**
- Replacing physical surveys with automated, daily headless ingestion.
- Stratifying observation windows into locked $T+7$ and $T+30$ buckets.
- Applying a monthly chain-linked geometric index (the international standard recommended by IMF and Eurostat).
- Weighting corridors by real annual passenger volume from DGCA Annual Statistics.

---

## 🏗️ System Architecture & End-to-End Workflow

```
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 1. INGESTION & COMPLIANCE                                                              │
 │   • Direct Connectors: Air India Direct (Source 1) + IndiGo Direct (Source 2)          │
 │   • Compliance Gate: robots_gate.py verifies robots.txt permissions & crawl delays     │
 │   • Gap-Filler: synthetic_generator.py fills missing slices (clearly tagged 'imputed') │
 └─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                           │
                                           ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 2. DATA VALIDATION, CLEANING & STORAGE                                                 │
 │   • Statistical IQR Outlier Detection (removes faulty fare anomalies)                  │
 │   • Component Reconciliation (base_fare + taxes = total_fare)                          │
 │   • Provenance Guard: Generates SHA-256 fingerprint + ISO fetch timestamp             │
 │   • Supabase PostgreSQL: Persists into fare_quotes, cross_source_check, ingestion_runs │
 └─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                           │
                                           ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 3. INDEX COMPUTATION ENGINE (index_engine/)                                            │
 │   • Loads DGCA Annual Traffic Weights (DEL-BOM: 43.8%, DEL-BLR: 32.2%, BOM-BLR: 24.0%) │
 │   • Computes daily & weekly weighted geometric mean index                              │
 │   • Monthly chain-linking resets base to prevent long-term baseline drift              │
 └─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                           │
                                           ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 4. BACKEND API SERVICE (FastAPI + Uvicorn)                                             │
 │   • 10 High-Performance Endpoints (/apix, /apix/heatmap, /apix/elasticity, etc.)       │
 │   • In-memory caching, CORS sanitization, and Pydantic v2 data serialization           │
 └─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                           │
                                           ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ 5. ENTERPRISE SAAS DASHBOARD (React 19 + Vite + Tailwind v4 + Recharts)                │
 │   • 8 Interactive Pages with Dark/Light Mode, Export, and Real-Time Health Monitoring  │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technologies | Key Responsibilities |
|---|---|---|
| **Frontend Framework** | **React 19**, **TypeScript**, **Vite 6** | Modern Single Page Application with optimized bundle splitting |
| **Styling & Theme** | **Tailwind CSS v4**, **Lucide React** | Glassmorphic financial dashboard styling with full Dark & Light mode |
| **Data Visualizations**| **Recharts** | Time-series inflation curves, lead-time elasticity charts, route heatmaps |
| **Client State / Async**| **TanStack React Query**, **React Router v6** | Data fetching, auto-refetching, client-side route handling, loading states |
| **Backend API** | **FastAPI**, **Uvicorn**, **Pydantic v2** | Async REST API, route filtering, statistical aggregation, JSON endpoints |
| **Data Ingestion** | **Python 3.9+**, **Playwright (Chromium)** | Direct airline web scraping with headless execution |
| **Data Science & Math**| **Pandas**, **NumPy** | Statistical outlier filtering (IQR), route log-differencing, chain-linking |
| **Database & Storage** | **Supabase PostgreSQL** | Relational schema, JSONB cryptographic provenance, strict check constraints |
| **Testing & CI** | **Pytest**, **Pytest-Asyncio** (145+ tests) | 100% offline unit tests covering analytics, index engine, schema, compliance |
| **Hosting & Cloud** | **Docker**, **Render / Railway**, **Vercel** | Multi-cloud ready (Procfile, render.yaml, railway.toml, vercel.json) |

---

## 📐 Mathematical Methodology

### 1. The Core Index Formula
AeroIndex implements a **DGCA-traffic-weighted, chain-linked geometric mean** (a superlative index equivalent to the Jevons/Törnqvist standard):

$$I_t = I_{t-1} \times \prod_{r \in \text{Routes}} \left( \frac{P_{r,t}}{P_{r,t-1}} \right)^{w_r}$$

Where:
* $I_t$: Airfare Price Index value on day $t$ (Baseline $I_0 = 100.0$).
* $P_{r,t}$: Median observed fare for route corridor $r$ on date $t$.
* $w_r$: Official DGCA passenger volume weight for route $r$ ($\sum w_r = 1.0$).
* **Monthly Chain-Linking**: Resets the base period at the start of each calendar month, bounding index drift.

### 2. Route Basket & DGCA Passenger Traffic Weights
Weights are sourced directly from the **Directorate General of Civil Aviation (DGCA) Annual Domestic Traffic Survey**:

| Route Corridor | Origin / Destination | DGCA Annual Passengers | Weight ($w_r$) | Rationale |
|---|---|---|---|---|
| **DEL-BOM** | Delhi ⇄ Mumbai | ~5.53 Million | **43.8%** | Primary national trunk business route |
| **DEL-BLR** | Delhi ⇄ Bengaluru | ~4.15 Million | **32.2%** | High-density tech & executive corridor |
| **BOM-BLR** | Mumbai ⇄ Bengaluru | ~3.43 Million | **24.0%** | Key commercial inter-city transit route |

### 3. Advance-Purchase Stratification
Airlines employ algorithmic dynamic yield curves based on departure proximity. APIx monitors two distinct booking horizons:
* **$T+7$ Days (Short-Lead Window)**: Captures price elasticity for emergency, business, and short-notice travel.
* **$T+30$ Days (Advance-Purchase Window)**: Captures base tariff inflation and leisure/vacation planning fares.

$$\text{Lead-Time Premium Elasticity} = \frac{\overline{P}_{T+7} - \overline{P}_{T+30}}{\overline{P}_{T+30}} \times 100\%$$

---

## 🖥️ The 8-Page SaaS Dashboard

The frontend application provides 8 dedicated modules:

| Page | Path | Key Features & Visualizations |
|---|---|---|
| **1. Overview** | `/` | Headline index card ($I_t$), 24h/7d delta, automated natural-language policy summary, corridor snapshot cards. |
| **2. Air Fare Index** | `/index` | Interactive time-series line chart (daily & weekly), observed vs imputed markers, route × window price heatmap matrix. |
| **3. Route Analytics**| `/routes` | Lead-time surge elasticity curve ($T+7$ vs $T+30$), individual route price history, index contribution breakdown. |
| **4. Data Explorer** | `/explorer` | Filterable, paginated raw fare quote tables with base fare, taxes, source tags, and sold-out status badges. |
| **5. Data Quality** | `/quality` | Data confidence score (0–100%), IQR outlier detection metrics, cross-source price discrepancy log. |
| **6. DGCA Benchmarking**| `/benchmarking` | Backtesting dual-line chart comparing APIx against DGCA Tariff & Fare Monitor benchmarks with ±15% threshold flags. |
| **7. Methodology** | `/methodology` | Scientific disclosure of mathematical formulas, traffic weights citation, and robots.txt compliance audit. |
| **8. System Health** | `/health` | Live PostgreSQL connectivity indicator, pipeline execution run log, and per-source data freshness timestamps. |

---

## 🛡️ Data Integrity & Compliance (RobotsGate & Provenance)

### 1. Automated Compliance Gating (`src/compliance/robots_gate.py`)
* **Strict Robots.txt Adherence**: Before scraping any airline URL, the `RobotsGate` fetches, hashes, and validates site policies.
* **OTA Exclusion**: Major Online Travel Agencies (Ixigo, EaseMyTrip, Cleartrip) explicitly disallow flight search bots in their `robots.txt`. AeroIndex **strictly excludes them**, gathering data solely from permissive airline-direct endpoints.

### 2. Cryptographic Provenance (`src/validation/provenance_guard.py`)
Every row in `fare_quotes` contains a JSONB `provenance` payload enforced by PostgreSQL database check constraints:
```json
{
  "raw_sha256": "8f4a2c1b9e3d7a6e...",
  "fetched_at": "2026-09-08T01:03:00Z",
  "channel": "web",
  "source": "air_india_direct"
}
```
* **Constraint Compliance**: Observed quotes without a valid SHA-256 hash and timestamp are automatically rejected by the database.

---

## 📂 Project Directory Structure

```
AeroIndex_SIH/
├── AGENTS.md                   # Persistent project memory, sprint log & known issues
├── README.md                   # Complete system documentation (this file)
├── Procfile                    # Cloud process manager start command
├── Dockerfile                  # Production container definition
├── render.yaml / railway.toml  # Infrastructure blueprints
├── package.json / vercel.json  # Frontend monorepo & SPA rewrite configuration
├── requirements.txt            # Python dependencies (relaxed for Python 3.9+)
├── pytest.ini                  # Pytest runner configuration
│
├── src/                        # Backend Application Source
│   ├── api/
│   │   ├── main.py             # FastAPI entry point & 10 REST endpoints
│   │   ├── analytics.py        # Heatmap, elasticity, summary, and contribution analytics
│   │   ├── data_quality.py     # Outlier summaries and completeness aggregations
│   │   ├── quotes.py           # Parameterized SQL query builder for Data Explorer
│   │   └── system_health.py    # Health status evaluation
│   ├── cleaning/
│   │   └── pipeline.py         # IQR outlier detection, deduplication, reconciliation
│   ├── compliance/
│   │   └── robots_gate.py      # Automated robots.txt compliance gatekeeper
│   ├── db/
│   │   ├── schema.sql          # PostgreSQL DDL for fare_quotes, cross_source_check, ingestion_runs
│   │   ├── connection.py       # Thread-safe database connection context manager
│   │   └── init_db.py          # Database initializer script
│   ├── index_engine/
│   │   ├── weights.py          # DGCA passenger volume weights loader & validator
│   │   ├── compute_index.py    # Geometric-mean chain-linked index calculations
│   │   └── plot_sanity_check.py# Matplotlib index visual sanity checker
│   ├── ingestion/
│   │   ├── connectors/         # BaseConnector ABC, air_india_direct.py, indigo_direct.py
│   │   ├── synthetic_generator.py # DGCA-calibrated synthetic gap filler
│   │   ├── db_writer.py        # Secure PostgreSQL batch writer with provenance
│   │   ├── run_log.py          # ingestion_runs step logger
│   │   └── run_all.py          # Orchestration pipeline CLI
│   └── validation/
│       ├── cross_source_check.py # Air India vs IndiGo cross-validation logger
│       └── provenance_guard.py   # SHA-256 fingerprint validator
│
├── frontend/                   # React 19 Frontend Application
│   ├── index.html
│   ├── vite.config.ts          # Vite build config with vendor code splitting
│   ├── src/
│   │   ├── main.tsx & App.tsx  # React entry point & routing configuration
│   │   ├── api/                # Typed API client functions
│   │   ├── types/apix.ts       # TypeScript interface definitions
│   │   ├── hooks/              # TanStack React Query hooks
│   │   ├── components/         # Modular UI, Layout, Charts, Tables, & Health components
│   │   └── pages/              # 8 Application pages
│
└── tests/                      # 145+ Offline Pytest Unit & Integration Tests
    ├── test_analytics.py
    ├── test_backtest.py
    ├── test_cleaning.py
    ├── test_cross_source_check.py
    ├── test_data_quality.py
    ├── test_index_engine.py
    ├── test_provenance_guard.py
    ├── test_robots_gate.py
    ├── test_schema.py
    └── test_system_health.py
```

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
- **Python 3.9+**
- **Node.js 18+** & **npm**
- **PostgreSQL** instance (or free [Supabase](https://supabase.com) project)

### 2. Clone & Environment Setup
```bash
# Clone the repository
git clone https://github.com/itsksfit/AeroIndex_SIH.git
cd AeroIndex_SIH

# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install backend dependencies & Playwright Chromium browser
pip install -r requirements.txt
playwright install chromium

# Configure Environment Variables
cp .env.example .env
# Edit .env and paste your Supabase DATABASE_URL
```

### 3. Initialize Database Schema
```bash
python src/db/init_db.py
# Expected output: "Tables confirmed: ['cross_source_check', 'fare_quotes', 'ingestion_runs'] - Connection OK"
```

### 4. Run Data Ingestion (Populate Fares)
```bash
# Runs scrapers, synthetic gap-filler, and records SHA-256 provenance
python -m src.ingestion.run_all
```

### 5. Launch Backend & Frontend Dev Servers

**Terminal 1 — Backend API:**
```bash
source .venv/bin/activate
uvicorn src.api.main:app --reload --port 8000
# OpenAPI Docs: http://localhost:8000/docs
```

**Terminal 2 — Frontend UI:**
```bash
cd frontend
npm install
npm run dev
# Dashboard: http://localhost:5173
```

---

## 🧪 Testing & Quality Assurance

AeroIndex includes a comprehensive suite of **145 offline unit and integration tests** requiring no external network or database connection:

```bash
# Run all backend tests
PYTHONPATH=. pytest

# Run frontend type checking, linting, and build validation
cd frontend
npx tsc -b
npm run build
```

---

## 🌐 Deployment Guide

### Multi-Cloud Ready
* **Backend (FastAPI)**: Deployable to **Render**, **Railway**, or any Docker host using the included `Dockerfile` and `Procfile`.
* **Frontend (React)**: Deployable to **Vercel** or **Netlify** with automatic client-side SPA routing (`vercel.json` & `netlify.toml`).

For comprehensive deployment instructions and cloud environment variable configurations, see [docs/deployment.md](docs/deployment.md).

---

## 📚 Academic & Institutional References

1. **Cavallo, A., & Rigobon, R. (2016)**. *"The Billion Prices Project: Using Online Prices for Measurement and Research."* **Journal of Economic Perspectives**, 30(2), 151–178. [Link](https://www.aeaweb.org/articles?id=10.1257/jep.30.2.151)
2. **International Monetary Fund (IMF) (2020)**. *"Consumer Price Index Manual: Concepts and Methods."* Chapter 10: Scanner Data & Web Scraping. [Link](https://www.imf.org/en/Data/Statistics/cpi-manual)
3. **de Haan, J., & Hendriks, R. (2013)**. *"Online Data Collection and Price Index Construction for Airfares and Hotel Transactions."* **Eurostat / Statistics Netherlands (CBS)**. [PDF](https://www.ottawagroup.org/Ottawa/ottawagroup.nsf/home/13th+Meeting/$File/de%20Haan%20and%20Hendriks%20-%20Online%20Data%20Collection%20and%20Price%20Index%20Construction%20for%20Airfares.pdf)
4. **Borenstein, S., & Rose, N. L. (1994)**. *"Competition and Price Dispersion in the U.S. Airline Industry."* **Journal of Political Economy**, 102(4), 653–683. [Link](https://www.journals.uchicago.edu/doi/10.1086/261953)
5. **Directorate General of Civil Aviation (DGCA) India (2023)**. *"Handbook of Civil Aviation Statistics & Domestic City-Pair Passenger Volume Reports."* [Link](https://www.dgca.gov.in)
6. **Ministry of Statistics and Programme Implementation (MoSPI)**. *"Consumer Price Index Manual: Concepts and Procedures."* Government of India. [Link](https://www.mospi.gov.in)

---

<div align="center">
  <sub>Built with precision for <b>Smart India Hackathon</b>. Designed for empirical rigor, full data transparency, and public policy impact.</sub>
</div>
