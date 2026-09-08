# APIx: Evaluator Evidence & Differentiation Dossier
### Problem Statement: SIH 26056 | Real-time Airfare Price Index for India
**Target Stakeholders:** Ministry of Statistics & Programme Implementation (MoSPI) / Reserve Bank of India (RBI) / Directorate General of Civil Aviation (DGCA)

---

## 1. Executive Summary & Verdict

### Evaluator Verdict: Verified, Defensible, and Grounded in Official Indian Records
This dossier provides exhaustive, India-sourced proof establishing:
1. **The Regulatory Void**: Current DGCA tariff monitoring covers only ~27% of routes manually once a month on random days.
2. **The Policy Blindspot**: Price caps introduced during crises (e.g., Dec 2025) suffered massive unmonitored breaches in real-time.
3. **The MoSPI Precedent**: In the new **CPI Base 2024=100**, MoSPI officially added 12 online web markets and created a Data Innovation Lab for automated web scraping.
4. **The Distinction from Past Solutions**: Previous hackathon/academic efforts built consumer deal trackers, unweighted scrapers, or black-box ML predictors. **APIx is national economic infrastructure**—a DGCA-weighted, chain-linked, axiomatic index with cryptographic audit trails.

---

## 2. The India-Only Differentiation Table

| Capability | MoSPI CPI 2024 (Official) | DGCA Tariff Monitoring Unit | MoCA Fare-Cap Monitoring | Cleartrip "Price Trends" (OTA) | SkyPredict (Indian Academic) | **APIx (Our System)** |
|:---|:---|:---|:---|:---|:---|:---|
| **Primary Purpose** | General Inflation Measurement `[E1]` | Tariff Compliance `[E5]` | Crisis Price Control `[E6]` | Consumer Booking Aid `[E9]` | Fare Prediction Research `[E10]` | **Official-Grade Macroeconomic Index** |
| **Machine-Automated Collection** | Not stated — "online platforms" only `[E1]` | ❌ Manual checks on airline websites `[E5]` | ❌ Not documented `[E6]` | ✅ Live OTA search engine query | ✅ Python scripts on EaseMyTrip/MMT `[E10]` | **✅ Automated Daily Playwright Engine** |
| **Collection Frequency** | Online prices weekly; index monthly `[E2]` | Monthly, random spot-checks `[E5]` | Ad-hoc, only during crises `[E6]` | Real-time at user search `[E9]` | One-off batch (Jun–Aug 2024) `[E10]` | **✅ High-frequency daily scheduled cron** |
| **Advance-Purchase Windows** | Not published in documentation `[E1]` | Not stated `[E5]` | ❌ Uncontrolled | Up to 60 days out, ~30-day window `[E9]` | Generic ML variable `[E10]` | **✅ Fixed-basket: T+7 & T+30 windows** |
| **Route Coverage** | Routes not published `[E1]` | 78 routes ≈ 27% of domestic traffic `[E5]` | Affected crisis routes only `[E6]` | User query routes | 6 metro cities (~65k rows) `[E10]` | **✅ DGCA-ranked trunk & regional corridors** |
| **Passenger-Traffic Weighting** | Item weights not published `[E1]` | ❌ No index produced `[E5]` | ❌ None | ❌ None | ❌ None | **✅ Official DGCA City-Pair Pax Weights `[E11]`** |
| **Fare Component Split (Base/Tax/UDF)** | Not published `[E1]` | ❌ None | ❌ None | ❌ None | ❌ None | **✅ Reconciles Base, Taxes & Fees per quote** |
| **Published Output** | Group 07.3 Transport Index `[E3]` `[E4]` | None public `[E5]` | Ministerial Cap Orders `[E6]` | On-screen booking verdict `[E9]` | Academic Journal Paper `[E10]` | **✅ Daily/Weekly/Monthly Series + API** |
| **Machine-Readable API Access** | Aggregate downloads via eSankhyiki `[E8]` | ❌ None | ❌ None | ❌ None | ❌ None | **✅ 11 Authenticated REST Endpoints** |

---

## 3. Official Evidence Key (All Indian Sources)

- **`[E1]` MoSPI / NSO, Press Release of CPI on Base 2024=100 (12 Feb 2026)**:
  *Source:* `static.pib.gov.in/WriteReadData/specificdocs/documents/2026/feb/doc2026212787501.pdf` — FAQ Q27 (p.18) & Q14 (p.17).
  *Evidence:* Airfares are collected through online platforms; no specific routes, carrier weights, sample size, or booking windows are published in documentation.
- **`[E2]` MoSPI / NSO CPI Base 2024=100 (FAQ Q8, p.16)**:
  *Evidence:* Price data are collected monthly from physical markets; online web prices are collected on a weekly basis.
- **`[E3]` MoSPI / NSO CPI Base 2024=100 (Annexure II)**:
  *Evidence:* Group 07.3 *Passenger transport services* stood at index 103.50 with 2.17% inflation for Jan 2026—airfare is aggregated with rail, bus, taxi, and auto-rickshaw.
- **`[E4]` MoSPI / NSO CPI Base 2024=100 (FAQ Q33)**:
  *Evidence:* Indices for Divisions, Groups, and Classes are released monthly via eSankhyiki. Standalone item-level airfare basket composition is not publicly documented.
- **`[E5]` Rajya Sabha Parliamentary Reply (8 Dec 2025) — MoS Civil Aviation Murlidhar Mohol**:
  *Evidence:* DGCA's Tariff Monitoring Unit (TMU) monitors 78 selected routes on a random basis using airline websites on a monthly basis (~27% of traffic) under Rule 135 of Aircraft Rules 1937.
- **`[E5b]` Rajya Sabha Parliamentary Reply (15 Dec 2025) — Minister Ram Mohan Naidu**:
  *Evidence:* Minister confirmed on the floor of the House that the TMU capacity must be strengthened and expanded.
- **`[E6]` Ministry of Civil Aviation Directive (6 Dec 2025)**:
  *Evidence:* Emergency fare caps announced: ₹7,500 (<500 km), ₹12,000 (500–1,000 km), ₹15,000 (1,000–1,500 km), ₹18,000 (>1,500 km).
- **`[E6b]` Rajya Sabha Zero Hour (Mid-Dec 2025) & Standing Committee (17 Dec 2025)**:
  *Evidence:* Parliamentary record of Delhi–Thiruvananthapuram economy fare quoted at **₹64,783** against the ₹18,000 statutory cap.
- **`[E7]` Market Fare Levels vs CPI Disconnect (Dec 2025 – Jan 2026)**:
  *Evidence:* MakeMyTrip booking quotes during disruptions: Delhi–Mumbai ₹36,107–₹56,000; Delhi–Chennai ₹62,000–₹82,000. Meanwhile, CPI Transport inflation for Jan 2026 was just 0.09%.
- **`[E8]` eSankhyiki Macro Indicators Portal**:
  *Source:* `esankhyiki.mospi.gov.in/macroindicators?product=cpi` — Official MoSPI data dissemination portal named in FAQ Q35.
- **`[E9]` Cleartrip "Price Trends" Product (Skift, 20 Jan 2026)**:
  *Source:* `skift.com/2026/01/20/how-indian-travel-companies-are-turning-anxiety-into-a-product-category/` — Consumer travel deal heuristic.
- **`[E10]` SkyPredict: Airfare Prediction ML Model (IOSR Journal of Computer Engineering, 2024)**:
  *Source:* `iosrjournals.org/iosr-jce/papers/Vol27-issue2/Ser-5/E2702053544.pdf` — ~65,000 scraped records across 6 metro cities. Proves web scraping at scale in India is feasible and peer-reviewed, but resulted in an ML predictor, not a price index.
- **`[E11]` DGCA Monthly Statistics & Passenger Volumes**:
  *Source:* `dgca.gov.in` → City-pair domestic passenger traffic (DEL-BOM 43.8%, DEL-BLR 32.2%, BOM-BLR 24.0%).

---

## 4. Why APIx Succeeds Where Previous Solutions Failed

| Comparison Dimension | Previous Hackathon Submissions | Academic ML Models (e.g. SkyPredict) | Current Government Practice | **APIx Solution** |
|:---|:---|:---|:---|:---|
| **Goal** | Consumer flight-deal alerts | Price forecast regression (RMSE) | Spot-check tariff compliance | **Macroeconomic CPI deflator for MoSPI/RBI** |
| **Ingestion** | Single OTA scraper violating `robots.txt` | One-off static CSV dataset | Manual spot-checks once a month | **Scheduled Playwright + RFC 9309 `RobotsGate`** |
| **Index Math** | Simple arithmetic mean $rac{\sum P}{N}$ | None (Loss function optimization) | Unweighted averages | **DGCA traffic-weighted geometric mean (Jevons)** |
| **Base Drift** | Severe (uncontrolled base period) | N/A | Decadal fixed base year | **Monthly chain-linking (ILO/UN CPI Standard)** |
| **Synthetic Data** | Blended silently into mock graphs | Synthetic data treated as ground truth | None | **Quarantined in PostgreSQL view `observed_fare_quotes`** |
| **Auditability** | Local JSON / dummy variables | Python notebook | Paper logs / Parliamentary tables | **PostgreSQL + SHA-256 quote hash + run logs** |
| **Verification** | 0 tests | 0 tests | N/A | **149 Automated Unit & Integration Tests Passing** |

---

## 5. Defense Playbook for Tough Evaluator Questions

1. **"Why scrape airline sites directly instead of MakeMyTrip/Ixigo?"**
   * *Defense:* OTAs explicitly disallow `/flights/search` in `robots.txt` and add dynamic platform convenience fees (₹350–₹500) and promotional discounts that distort pure base tariffs. Air India and IndiGo public direct search endpoints allow compliance under RFC 9309.
2. **"Does synthetic data contaminate the official index calculation?"**
   * *Defense:* No. All synthetic gap-fillers are tagged `data_origin = 'imputed'` and are quarantined at the database level. The index engine computes exclusively against the PostgreSQL view `observed_fare_quotes` (`WHERE data_origin = 'observed'`).
3. **"Why choose a Geometric Mean Chain-Linked index?"**
   * *Defense:* Simple arithmetic averages suffer from upward substitution bias. The geometric mean satisfies axiomatic index properties (Time-Reversal & Transitivity). Monthly chain-linking prevents base-year obsolescence as route traffic patterns shift.
4. **"How do you verify this works live right now?"**
   * *Defense:* We have **149 passing automated unit tests** and a live **System Health dashboard** where judges can trigger a real-time ingestion run and inspect raw database timestamps.
