# APIx Development Blueprint — SIH 26056
### For: Prince & Krishna (dev) — reference this whole document across both days
### v2 — updated with judge-risk mitigations

---

## 0. What we're building (one paragraph, keep this pinned)

A prototype Real-time Airfare Price Index (APIx) for 3 routes (DEL-BOM, DEL-BLR, BOM-BLR) and 2 advance-purchase windows (T+7, T+30), built from **at least two independent scraped sources** plus a clearly-labeled synthetic gap-filler, cleaned into a structured schema, turned into **one** DGCA-weighted index using a defensible formula (not naive averaging, and not multiple competing formulas we can't explain), backtested against DGCA's published average fares, and served through a dashboard + JSON API that surfaces **methodology, not just a number** — framed the whole way as infrastructure for NSO/RBI, not a consumer flight-deal app.

---

## 1. Judge risk check — read this before you build anything

A judge who knows statistics will try to break this pitch in five specific ways. Every phase below exists to pre-empt one of these.

| Risk | Why judges challenge it | Where it's handled |
|---|---|---|
| Scraping only one OTA | "Is this representative of the Indian market?" | Phase 1 — two independent sources, pluggable connectors |
| Synthetic data dominating the demo | "Is this actually real?" | Phase 1b — synthetic is a gap-filler only, always tagged, never blended silently |
| Arbitrary weights | "Why should we trust your index?" | Phase 3 + Phase 5 — weights come from DGCA traffic data, shown on-screen, not buried in code |
| Overcomplicated Fisher/Jevons maths | "Why is this necessary?" | Phase 3 — ONE formula, chosen and justified in plain English; extra formulas are optional bonus material only |
| Pretty dashboard, no policy value | "So what can government actually do with it?" | Phase 5 — a "Methodology" panel and a "What this means" panel are mandatory, not optional |

If you're ever unsure whether to add something, ask: **does this make one of these five answers stronger, or is it just polish?** Polish comes after these five are solid, never before.

---

## 2. Final tech stack (lock this before writing code)

| Layer | Choice | Why |
|---|---|---|
| Ingestion | Python + Playwright, **two independent connectors** (one direct airline site, one OTA) + a synthetic gap-filler generator | A single-source index isn't credible as "representative of the Indian market" — two sources is the minimum defensible claim |
| Storage | Postgres (Supabase or Neon free tier) — SQLite as local fallback | Structured, time-series-friendly, free-tier-friendly |
| Cleaning | Pandas | Standard, fast to write, judges won't question it |
| Index engine | Pandas + NumPy, **one locked formula**: DGCA-traffic-weighted, chain-linked | One formula you can explain beats two formulas you can't defend under questioning |
| Dashboard | Streamlit (fastest) or React + Recharts (if Krishna prefers frontend) | Streamlit gets you a working demo in hours; React looks more polished if there's time |
| API | FastAPI | Returns the index number **plus its methodology metadata** — not just a bare number |
| Hosting (if needed) | Streamlit Community Cloud (dashboard) + Render or Railway free tier (API) | Zero-cost, quick deploy |

**Decide and write this into `AGENTS.md` (below) before generating any code — don't let an AI agent pick the stack for you mid-build, it'll thrash.**

---

## 3. Repo structure

```
apix-prototype/
├── AGENTS.md                    # persistent context file — READ FIRST every session
├── README.md
├── data/
│   ├── raw/                     # raw responses, one subfolder per source
│   │   ├── airline_direct/
│   │   └── ota/
│   ├── synthetic/                # generated gap-filler data — always kept separate
│   └── clean/                    # post-cleaning-pipeline output
├── src/
│   ├── ingestion/
│   │   ├── connectors/
│   │   │   ├── airline_direct.py    # Source 1 — pick one airline site
│   │   │   └── ota.py                # Source 2 — pick one OTA
│   │   └── synthetic_generator.py    # gap-filler only, tags source_name='synthetic_estimate'
│   ├── validation/
│   │   └── cross_source_check.py     # compares Source 1 vs Source 2 on overlapping route/date
│   ├── cleaning/
│   │   └── pipeline.py
│   ├── index_engine/
│   │   ├── weights.py                # DGCA passenger-traffic-derived route weights
│   │   └── compute_index.py          # the one locked formula
│   ├── backtest/
│   │   └── compare_dgca.py
│   └── api/
│       └── main.py                   # FastAPI app — returns index + methodology metadata
├── dashboard/
│   └── app.py                        # Streamlit app — includes Methodology + "What this means" panels
├── tests/
└── docs/
    ├── methodology.md                # index-formula justification (feeds the deck's methodology slide)
    └── compliance.md                 # robots.txt / rate-limit notes (feeds compliance slide)
```

---

## 4. Data schema (lock this — everything downstream depends on it)

```
fare_quotes
-----------
id                    UUID
route                 TEXT     -- e.g. 'DEL-BOM'
carrier               TEXT
date_scraped          DATE
travel_date           DATE
advance_purchase_days INT      -- 7 or 30
fare_class            TEXT
base_fare             NUMERIC
taxes                 NUMERIC
total_fare            NUMERIC
source_name           TEXT     -- e.g. 'indigo_direct', 'ixigo', 'synthetic_estimate'
                                -- NOT just real/synthetic — every price must be traceable
is_sold_out           BOOLEAN

cross_source_check
-------------------
id                    UUID
route                 TEXT
travel_date           DATE
advance_purchase_days INT
source_a              TEXT
source_b              TEXT
price_a               NUMERIC
price_b               NUMERIC
pct_difference        NUMERIC   -- this is your "not a fluke of one site" proof — surface it in the deck & dashboard
```

---

## 5. Phases

### Phase 0 — Setup (30–45 min)
Repo, virtualenv, Postgres (Supabase/Neon) connection, `AGENTS.md` created and confirmed with the whole team before any code is generated.

### Phase 1 — Ingestion (two independent sources — non-negotiable)
Build **two** pluggable connectors: one direct airline site, one OTA. Both write to the same `fare_quotes` schema with an honest `source_name`. Architect as pluggable connectors so adding a third source later is trivial — that pluggability is itself part of the "is this representative?" answer.

### Phase 1b — Synthetic gap-filler (not a parallel dataset)
A generator that fills in routes/days you couldn't scrape in time, calibrated to DGCA published averages. Every record tagged `source_name = 'synthetic_estimate'`. It must never be visually indistinguishable from real data downstream — this is what Phase 5's "real vs. estimated" indicator enforces.

### Phase 1c — Cross-source validation
Wherever Source 1 and Source 2 both have a quote for the same route/date, compute and log the % difference into `cross_source_check`. This becomes your on-stage proof that the numbers aren't an artifact of one website's quirks.

### Phase 2 — Cleaning
Dedup, outlier flagging (IQR), base/tax/total reconciliation, sold-out handling. `source_name` must survive every step — never let it get dropped.

### Phase 3 — Index engine (one formula, locked)
DGCA-traffic-weighted, chain-linked fixed-basket index. Daily + weekly output. A plain-English code comment explaining why weighting beats a naive average — this is your direct answer to "why should we trust your index."

*Optional, skippable, only if time allows: Phase 3b adds a second formula purely as a labeled bonus comparison exhibit — never presented as the main result.*

### Phase 4 — Backtest
Compare monthly average of your index against DGCA's published average fares for the same routes. Flag any date with a large deviation — that's a data-quality signal worth showing, not hiding.

### Phase 5 — Dashboard + API (methodology is mandatory, not decoration)
Beyond the trend line, heatmap, and elasticity curve, the dashboard **must** include:
1. A visible real-vs-estimated indicator on every chart/number (e.g. dashed line or "estimated" tag) — never blend silently.
2. A **Methodology panel** showing the actual DGCA-derived route weights and the Phase 1c cross-source validation numbers.
3. A **"What this means" panel** — one auto-generated plain-English sentence per period (e.g. "Fares rose mainly on DEL-BOM this week, pushing the index up by X%").

The `/apix` endpoint returns the index number **plus** its methodology metadata (weights, sources, validation stats) — that's what makes it usable by NSO/RBI, not just visible.

### Phase 6 — Polish
Full run-through, README, demo script, fragility check. Rehearse answers to all five risks in Section 1 — every teammate should be able to answer any of them, not just the presenter.

*(This maps directly onto the hour-by-hour Day 1/Day 2 schedule already agreed with the team — phases here are the technical checkpoints inside that schedule.)*

---

## 6. Saving context across AI-agent sessions

The single biggest failure mode with agentic tools over a 2-day sprint is **re-explaining the project every session** or the agent silently forgetting a decision made 3 hours ago. Fix: one file, always read first, always updated last.

**Create `AGENTS.md` at the repo root.** This naming is a deliberate choice — it's become a common convention that many agentic tools (Antigravity, Cline, Copilot, Codex-style agents) will pick up automatically or can be pointed to explicitly. Structure it like this:

```markdown
# AGENTS.md — persistent project memory

## Goal
[one paragraph, copy from Section 0 above]

## The five risks we're building against
[copy the table from Section 1 — keep this visible so no session drifts into "just make it pretty"]

## Tech stack (locked)
[copy Section 2 table]

## Schema (locked)
[copy Section 4]

## Phase log
### Phase 0 — Setup — DONE
- Repo created, Postgres connected via [Supabase/Neon]
- Decision: using Streamlit, not React (time constraint)

### Phase 1 — Ingestion — IN PROGRESS
- Source 1 (airline direct): [name], covers 3 routes
- Source 2 (OTA): [name], covers 3 routes
- Synthetic generator done, calibrated to DGCA averages: DEL-BOM ₹X, DEL-BLR ₹Y, BOM-BLR ₹Z
- BLOCKER: [anything stuck]
- NEXT: [exact next task]

## Known issues / fragile parts
[running list — update every session]
```

**Rule for the team: every agent session starts with "read AGENTS.md first" and ends with "update AGENTS.md before we stop."** This is non-negotiable — it's what lets you switch between Antigravity, Cline, or a different laptop entirely without losing hours re-explaining context.

---

## 7. Copy-paste prompts

### Kickoff prompt (paste once, very first session)

```
Hi! We're a 6-person student team building a 2-day hackathon prototype for an Indian
government problem statement (SIH 26056). I'd love your help building it end to end —
and I want to build it in a way that survives tough questions, not just look nice.

THE IDEA, IN PLAIN WORDS
Flight prices in India change wildly — sometimes 200–400% in a single day. But the
government's official inflation number (CPI) still checks flight prices by hand,
occasionally. We're building "APIx" — a system that checks flight prices automatically,
cleans up the messy data, and turns it into one trustworthy number, kind of like how
the Sensex is one number built from many stock prices. This is FOR India's Ministry of
Statistics (MoSPI) and the RBI — it's a policy tool, not a consumer flight-deal app.
Every design decision should be defensible if a judge asks "why should we trust this?"

SCOPE FOR THIS PROTOTYPE
- 3 routes: DEL-BOM, DEL-BLR, BOM-BLR
- 2 advance-purchase windows: 7 days out and 30 days out
- AT LEAST TWO independent data sources (see Phase 1 — this is non-negotiable, a
  single-source index isn't credible as "representative of the Indian market")

TECH STACK
- Python + Playwright for collecting prices
- Postgres (Supabase or Neon free tier) for storage
- Pandas/NumPy for cleaning and the index maths
- FastAPI for a small /apix JSON endpoint
- Streamlit for the dashboard

WORK IN PHASES — PLEASE DON'T JUMP AHEAD

Phase 0 — Set up the repo, connect Postgres, and create AGENTS.md at the root with:
this project's goal, tech stack, folder structure, and data schema. The schema MUST
include a `source_name` field (e.g. "IndiGo direct", "Ixigo", "synthetic_estimate") —
not just a real/synthetic flag — so every price is traceable to exactly where it came
from. Show me the plan before writing any code.

Phase 1 — Build TWO independent data collectors: one direct airline site (e.g. IndiGo
or Air India) and one OTA (e.g. Ixigo or EaseMyTrip tend to be less protected than
MakeMyTrip — pick whichever is easiest to reach politely). Be a polite guest: respect
robots.txt, add delays, keep request volume low. Architect this as pluggable
"connectors" so adding a third source later is trivial — that pluggability itself is
part of our answer to "is one OTA representative?"

Phase 1b — Build a synthetic data generator, but treat it strictly as a GAP-FILLER for
routes/days/hours we couldn't scrape in time — not a parallel full dataset. Every
synthetic record must be tagged `source_name = synthetic_estimate` and must NEVER be
visually indistinguishable from real data downstream (see Phase 5).

Phase 1c — Wherever we have data for the same route/date from both sources, compute
the % difference between them and log it. This becomes our "these numbers aren't a
fluke of one site" proof — surface it later in the methodology panel.

Phase 2 — Build a cleaning step: remove duplicates/weird entries, flag outliers, split
base fare from taxes, mark (don't delete) sold-out flights. Preserve `source_name`
through every step — never let it get dropped.

Phase 3 — Build ONE index formula, done properly: a fixed-basket weighted index using
DGCA's published city-pair passenger traffic share as the weights (I'll give you the
numbers, and cite the DGCA dataset name in a comment), chain-linked monthly to avoid
drift. Do NOT build multiple competing formulas (Laspeyres AND Fisher AND Jevons) —
that's complexity we can't defend on stage. One formula, one clear plain-English reason
in a code comment for why weighting beats a naive average. If — and only if — everything
else is done with time to spare, Phase 3b (optional, skippable) can add a second formula
purely as a side-by-side comparison exhibit, clearly marked as bonus material.

Phase 4 — Compare our index against publicly available DGCA average fare data. Tell me
plainly whether it looks reasonable, and flag any date where the deviation is large —
that's a data-quality signal, not just a chart.

Phase 5 — Build the dashboard and /apix API. It MUST include, beyond the pretty chart:
  1. A visible real-vs-estimated indicator on every chart/number — e.g. a dashed line
     or a small "estimated" tag — never blend synthetic and real silently.
  2. A "Methodology" panel showing the actual route weights used and that they come
     from DGCA passenger traffic data, plus the cross-source validation numbers from
     Phase 1c. This is the direct answer to "why should we trust your index."
  3. A "What this means" panel — one auto-generated plain-English sentence per period,
     e.g. "Fares rose mainly on DEL-BOM this week, pushing the index up by X%." This is
     the direct answer to "what can government actually do with this."
  The /apix endpoint should return the methodology metadata (weights, sources) alongside
  the number, not just the number — that's what makes it usable, not just visible.

Phase 6 — Polish for a live demo. Check nothing breaks, write a short README, and
rehearse answers to: why two sources, why these weights, why this formula and not a
fancier one, and what a policymaker does with this number.

DESIGN & TONE — KEEP THIS HUMANIZED AND LIGHT, BUT NEVER AT THE COST OF SUBSTANCE
This goes to a government audience, but shouldn't feel cold or bureaucratic:
- Light color palette — soft whites and sky blues, not a dark "trading terminal" look
- Friendly microcopy — "Here's what flights are costing today" over "Aggregate Fare
  Index Output" — but every number still needs its methodology one tap/click away
- Rounded, approachable cards; plain-language captions next to technical numbers
- The "Methodology" and "What this means" panels from Phase 5 are NOT optional
  extras — they're what separates a nice-looking demo from something a ministry could
  actually use. Design them to feel human too, just don't let "light and friendly" mean
  "vague."

MEMORY ACROSS SESSIONS
Always read AGENTS.md first, before touching anything. At the end of every phase,
update its "Phase log" with what's done, decisions made, anything blocking you, and
exactly what to pick up next — different teammates open this at different times over
the next two days, so this file is our shared memory.

Start with Phase 0, show me your plan, and wait for my go-ahead before writing code.
```

### Phase 1 + 1b + 1c — Ingestion, gap-filler, cross-validation

```
Read AGENTS.md first. Starting Phase 1.

1. Build TWO Playwright connectors: one for [pick an airline direct site] and one for
   [pick an OTA], both covering our 3 routes. Respect robots.txt, add a 3–5 second
   delay between requests, cap total requests for a demo. Save raw output to
   /data/raw/<source_name>/. Write both to the shared schema with an honest
   `source_name` for each (not just real/synthetic).
2. Build a synthetic gap-filler (Phase 1b) that only fills routes/days/windows we
   couldn't reach in time — calibrate the mean to DGCA's published average fares
   (I'll give you the numbers), model price rising as departure nears, tag every row
   `source_name = 'synthetic_estimate'`.
3. Build the cross-source check (Phase 1c): wherever Source 1 and Source 2 both have
   a quote for the same route/date, log the % difference into a `cross_source_check`
   table — this is our proof the numbers aren't a fluke of one website.

Write basic tests confirming schema compliance. Update AGENTS.md when done.
```

### Phase 2 — Cleaning

```
Read AGENTS.md. Phase 2: cleaning pipeline.

Build a pipeline that: dedupes near-identical quotes, flags outliers via IQR on
total_fare per route + advance-purchase window, checks base_fare + taxes ≈ total_fare
and flags mismatches, and marks (not drops) sold-out/missing quotes. Preserve
`source_name` through every step.

Also write docs/methodology.md explaining each cleaning rule in plain language —
I need this for the compliance slide. Update AGENTS.md.
```

### Phase 3 — Index engine (one formula, locked)

```
Read AGENTS.md. Phase 3: index construction.

Implement ONE formula: a fixed-basket index weighted by DGCA route traffic shares
(I'll provide the weights), chain-linked monthly to limit drift. Do not implement a
second competing formula unless everything else is already done — if you have spare
time later, an optional Phase 3b can add one as a clearly-labeled bonus comparison,
never as the headline result.

Compute daily and weekly, combined into one composite APIx value across our 3 routes.
Add a matplotlib sanity-check plot. Write a plain-English code comment explaining why
this weighted approach beats a naive average — I need that reasoning for Q&A. Update
AGENTS.md.
```

### Phase 4 — Backtest

```
Read AGENTS.md. Phase 4: backtest.

I'll give you DGCA's published monthly average fares for our 3 routes. Compare our
index's monthly average against these — compute % deviation and correlation, and plot
both series together. Flag any date with a large deviation instead of hiding it — that's
a data-quality signal worth having ready for Q&A. Write a short paragraph interpreting
the result for the pitch deck. Update AGENTS.md.
```

### Phase 5 — Dashboard + API (methodology mandatory)

```
Read AGENTS.md. Phase 5: dashboard + API.

Build a Streamlit dashboard with: APIx trend line (daily + weekly), a route-pair fare
heatmap, and a lead-time elasticity curve (fare vs. days-to-departure) for one route.
It must also include:
1. A visible real-vs-estimated indicator on every chart/number — never blend synthetic
   and real silently.
2. A Methodology panel showing the DGCA-derived route weights and the Phase 1c
   cross-source validation numbers.
3. A "What this means" panel — one plain-English sentence per period explaining what
   moved the index and why.

Build a FastAPI GET /apix endpoint returning the latest index value + history AND the
methodology metadata (weights, sources, validation stats) as JSON — framed as what
NSO/RBI would actually consume, not just a bare number. Keep the whole thing light and
human — soft colors, friendly captions — without making the methodology feel buried or
optional. Update AGENTS.md.
```

### Phase 6 — Polish

```
Read AGENTS.md. Phase 6: polish for demo.

Full run-through with current data — confirm every chart renders, add loading states,
write README setup instructions, draft a 2-minute scripted dashboard walkthrough.
Flag anything fragile that could fail live, and suggest what to pre-record as backup.
Also prepare one-line answers to: why two sources, why these weights, why this formula
and not a fancier one, and what a policymaker does with this number — the whole team
should be able to answer any of these, not just the presenter. Update AGENTS.md with a
final status summary.
```

### Resume prompt (use this every time you reopen the project)

```
Read AGENTS.md fully before doing anything else. Summarize back to me: current phase,
what's done, what's next, and any blockers noted. Then wait for my go-ahead.
```

---

## 8. Free & efficient AI coding agents (as of Aug 2026)

| Tool | Cost | Best for this project | Note |
|---|---|---|---|
| **Google Antigravity 2.0** | Free public preview | **Recommended primary.** Run parallel agents — one on Source 1 connector, one on Source 2/dashboard — and use its browser-in-the-loop mode to visually verify the scraper and dashboard actually render correctly | VS Code fork; runs Gemini 3 Pro/Flash and Claude Sonnet 4.6/Opus 4.6 |
| **Antigravity CLI** | Free | Terminal version of the above, with Agent Skills/Subagents | Replaced Google's old Gemini CLI |
| **Cline** (VS Code extension) | Free, open-source, bring-your-own API key | Full autonomous multi-file coding, strong for the index-engine/cleaning logic | You only pay for whatever model key you connect — use a free-tier key and it's $0 |
| **opencode** | Free, open-source, bring-your-own key | Terminal agent, most-starred open-source option | Model-agnostic |
| **GitHub Copilot Free** | Free forever, no card | Boilerplate, quick fill-ins, light chat | 2,000 completions + 50 chat requests/month |
| **Cursor / Windsurf** | Free tier available | Familiar AI-in-editor feel | Windsurf's branding/ownership has been shifting through 2026 (recent reports tie it to Cognition/Devin) — check the current site before depending on it |

**Practical suggestion for your 2 people:** Prince runs Antigravity (or Cline) on Source 1 connector + cleaning; Krishna runs a second Antigravity agent (or Copilot for quick fills) on Source 2 connector + index engine + dashboard, in parallel — that's the whole point of Antigravity's multi-agent Manager view, and it's the fastest way two people cover the full phase list in two days.

---

## 9. Free data & infra

**Flight/fare data (small free tiers — enough for a demo, not production):**
- DGCA open datasets (city-pair passenger traffic, fare-band monitoring) — free, no key, and it's also your backtest ground truth *and* your route-weight source
- Aviationstack — 100 free requests/month
- AeroDataBox — 600 free units/month
- FlightAPI.io — 20–100 free calls
- Travelpayouts Data API — free registration
- ⚠️ Amadeus Self-Service free tier is being decommissioned in 2026 — don't build a dependency on it now
- For your two required real sources: your own Playwright connectors (free) are more reliable than any of these free API tiers, which are too rate-limited for a real demo dataset. Pick one direct airline site and one OTA that are least protected against polite, low-volume scraping — Ixigo or EaseMyTrip tend to be easier starting points than MakeMyTrip.

**Hosting/DB (all $0 for hackathon scale):**
- Supabase — free Postgres + auth/storage bundled, 500MB
- Neon — free serverless Postgres, scale-to-zero, good if you want fast branching
- Streamlit Community Cloud — free hosting for the dashboard, deploys straight from GitHub
- Render / Railway — free tiers for the FastAPI backend
- GitHub Actions — free scheduled runs (2,000 min/month) if you want the scraper to run on a schedule without paying for a server

**Bonus:** if anyone on the team has a college email, the GitHub Student Developer Pack unlocks extra credits across several of these.
