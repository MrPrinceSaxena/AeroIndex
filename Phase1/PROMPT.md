# APIx — Live Ingestion Engine: Implementation Brief

Paste this into Cursor / Claude Code at the repo root. It assumes the four files
in this drop are already in place.

---

## Context you must not lose

The current repo runs the index on 100% synthetic fares calibrated to DGCA
averages, then "validates" that index against DGCA averages. That is circular.
Fixing it is a higher priority than any new feature.

The scrapers do not fail because of bad CSS selectors. They fail because the
fare-search funnel is closed to automated clients. Verified live on 2026-09-08,
`https://www.goindigo.in/robots.txt` contains, under `User-Agent: *`:

```
Disallow: /book/*
Disallow: /booking/*
Disallow: /bookings/*
Disallow: /search.html
Disallow: *.pdf
```

Air India's `ERR_HTTP2_PROTOCOL_ERROR` is the same boundary enforced at the
network layer by Akamai.

**Non-negotiable constraint:** do not implement stealth browser contexts, user-agent
rotation designed to disguise the client, IP/proxy rotation to evade rate limits,
CAPTCHA solving, or TLS fingerprint spoofing. Beyond the ethics, the problem
statement explicitly requires robots.txt and ToS compliance, so an evasive engine
fails the brief it is being judged against. Every request goes through
`RobotsGate`. There is no bypass flag; do not add one.

---

## Task 1 — Run the eligibility audit (do this first, today)

```bash
python -m scripts.audit_robots
```

Read `docs/compliance_annexe.md`. Then edit the `TARGETS` dict in
`scripts/audit_robots.py` so every probe URL is the **actual path your connector
would fetch**, not a homepage. Re-run. This tells you empirically which sources
are eligible instead of guessing.

Expected outcome: most airline and OTA fare-search paths come back DENY. That is
the finding, not a failure. It is the evidence base for Task 2.

## Task 2 — Stand up the licensed API channel

1. Get a key from a self-serve fare provider. **Amadeus Self-Service is dead** —
   the portal was decommissioned 17 July 2026 and keys deactivated; flight search
   now needs an Enterprise contract. Try Duffel first, then Skyscanner via
   RapidAPI, FlightAPI.io, or Travelpayouts. Assume one rejects you; apply to two.
2. `export APIX_FARE_API_KEY=...`
3. `python -m src.connectors.licensed_api --selftest`
4. Read the raw JSON it prints. Correct every field name in `DuffelAdapter.parse`
   against what the provider actually returned. Do not trust my mapping — verify it.
5. If you switch providers, write a new adapter class implementing `ProviderAdapter`
   and register it in `ADAPTERS`. Nothing else changes.

Acceptance: the selftest prints HTTP 200, a SHA-256, an archived raw file path, and
a parsed offer with a non-null `total_fare`.

## Task 3 — Apply the migration

```bash
psql "$DATABASE_URL" -f migrations/002_provenance_and_unlock.sql
```

Then populate `route_basket` from the current DGCA city-pair passenger statistics
and set `dgca_source_citation` on every row. Six routes minimum: DEL-BOM, DEL-BLR,
BOM-BLR, DEL-CCU, BLR-HYD, MAA-DEL.

**Then grep the whole repo for hardcoded baskets and delete them:**
- `main.py` — `Route = Literal[...]` becomes a runtime lookup against `route_basket`
- `connectors/__init__.py` — `ROUTES` and `ADVANCE_PURCHASE_DAYS` constants
- `weights.py` — weights must be derived from `route_basket.dgca_pax_annual`, not
  written as literals

## Task 4 — Break the circularity (highest priority)

1. Grep for every query in `compute_index.py`, `compare_dgca.py`, and the aggregation
   endpoints. Every one must read `observed_fare_quotes`, never `fare_quotes`.
2. Call `assert_observed_only(rows, context=...)` at the top of each index and
   backtest routine.
3. Add `assert_query_is_quarantined(sql, ...)` to your query-builder path.
4. **Delete `fill_gaps()` from the ingestion path entirely.** Keep
   `synthetic_generator.py` only if it writes rows tagged `data_origin='imputed'`
   for coverage display. If a cell has no observation, it has no observation.
5. Add a test that inserts one imputed row, runs the index, and asserts
   `CircularValidationError` is raised. This test is your proof.

## Task 5 — Coverage, not confidence

Wire `load_coverage()` into `GET /apix`. Every index response carries the coverage
block. The dashboard shows completeness beside the index number, and suppresses the
headline figure when `publishable` is false.

A judge who sees "index 103.2, based on 62% observed coverage across 4 of 6 routes"
trusts you more than one who sees "index 103.2" and later discovers it was modelled.

## Task 6 — Scheduling

APScheduler or cron, once daily, staggered across the route × window grid. Write an
`ingestion_runs` row per execution recording: rows observed, rows skipped by robots,
provider errors, and wall time. `GET /system/health` surfaces the last seven runs.

## Task 7 — The backtest, honestly

Two hard facts:
- Scraping is forward-only. It cannot generate the history a backtest needs.
- DGCA monitors fares monthly but does not publish a clean route-level monthly
  average-fare series of the kind the PS assumes. Verify this yourself before
  building against it.

So: start daily collection **tonight** — every day of delay is an unrecoverable row.
Then pick one and document it in `MethodologyPage`:
- (a) forward validation over however many days you actually accumulate, stated
  plainly as "N days observed" with N whatever it truly is; or
- (b) a reconstructed reference series from MoCA parliamentary replies and DGCA
  fare-monitoring disclosures, with each datapoint individually cited.

Do not manufacture a 30-day backtest. Writing "the reference series the PS assumes
is not published in that form; here is what exists and here is our forward
validation instead" is a finding that scores. A fabricated one is disqualifying.

---

## Definition of done

- [ ] `docs/compliance_annexe.md` regenerated within 7 days of submission
- [ ] `--selftest` returns real fares from a licensed provider
- [ ] Zero rows with `data_origin='observed'` lacking a `raw_sha256`
- [ ] Zero index or backtest queries touching `fare_quotes` directly
- [ ] Circularity regression test passes
- [ ] `GET /apix` returns a coverage block on every response
- [ ] Scheduler has run unattended for ≥3 consecutive days before demo day
- [ ] Demo script ends with a live `--selftest` run, on stage, against production

## The demo answer to "is this real data right now?"

Run `--selftest` live. It makes a real HTTPS call, prints the HTTP status, the
SHA-256 of the response body, the archive path, and the robots.txt decision that
authorised it — including which directive was evaluated. Then show
`docs/compliance_annexe.md`.

That is a stronger answer than a scraper that happens to work on the day, because
it is verifiable on stage and defensible in a procurement review.
