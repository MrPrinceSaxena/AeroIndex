# APIx Methodology

## Index Formula

The APIx is a **fixed-basket, DGCA-traffic-weighted, chain-linked price index**.

### Formula
For each day t:

    I(t) = I(t-1) * exp( SUM_over_routes[ w(route) * ln(fare(route,t) / fare(route,t-1)) ] )

where:
- `w(route)` = route's share of DGCA-reported domestic passenger traffic (see Weights section)
- `fare(route, t)` = median total fare observed on that route on date t
- `I(0)` = 100.0 (base value on first date of real data)

### Why weighted instead of a simple average?
A simple average treats DEL-BOM and BOM-BLR as equally important.
DEL-BOM carries ~3x the passenger traffic of BOM-BLR.
Weighting by traffic means a fare spike on a busy route has the proportional
impact on the index that it actually has on real travellers — the same logic
that drives CPI food weighting above luxury goods weighting.

### Why chain-linked?
Using a fixed base period (e.g. January 2023) causes index drift as market
conditions shift. Monthly chain-linking resets the reference each month,
keeping the index comparable to DGCA's published fare data over time.
This is the same approach used in India's GDP deflator and the international
standard for consumer price indices (IMF Manual on CPI, Chapter 15).

### Why not Laspeyres or Fisher?
- Laspeyres requires fixed-period quantity data we don't have.
- Fisher requires both current and past quantities — same problem.
- Jevons is a pure geometric mean with no traffic weighting — arbitrary.
Our formula is the simplest form that is both traffic-weighted and chain-linked.

---

## Route Weights

Source: DGCA Annual Traffic Survey — Domestic Traffic Statistics
Directorate General of Civil Aviation, India | FY2022-23
https://dgca.gov.in/digigov-portal/StatsDashBoard

| Route | Passengers (mn, FY22-23) | Weight in index |
|---|---|---|
| DEL-BOM | 12.4 | 0.4382 (43.8%) |
| DEL-BLR | 9.1 | 0.3216 (32.2%) |
| BOM-BLR | 6.8 | 0.2402 (24.0%) |

---

## Cleaning Rules

1. **Deduplication**: Exact duplicates (same route + date + fare + source) removed. Most recent scraped entry kept.
2. **Outlier flagging**: IQR method with 2.5x multiplier per route + advance window. Outliers flagged, NOT deleted — surge prices are real and relevant.
3. **Component reconciliation**: Rows where base_fare + taxes deviates > INR 50 from total_fare are flagged as `component_mismatch`.
4. **Sold-out handling**: Rows where `is_sold_out = TRUE` are excluded from index calculation but retained in the database.
5. **source_name invariant**: Never null, never dropped. Every record is traceable to its source.

---

## Data Sources

| Source | source_name | Type |
|---|---|---|
| Air India direct (airindia.com) | `air_india_direct` | Real — scraped |
| IndiGo direct (goindigo.in) | `indigo_direct` | Real — scraped |
| Synthetic gap-filler | `synthetic_estimate` | Estimated — calibrated to DGCA averages |

Synthetic data is used ONLY where real scrape data is unavailable.
It is always labeled in the dashboard and never blended with real data silently.
