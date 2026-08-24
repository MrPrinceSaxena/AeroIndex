# APIx — Data Collection Compliance Notes

## Robots.txt Review (conducted 2026-08-24)

| Site | URL | Disallows (relevant to us) | Decision |
|---|---|---|---|
| Air India | airindia.com/robots.txt | /bin/, company image assets, loyalty page | PERMITTED — flight search not disallowed |
| IndiGo | goindigo.in/robots.txt | Server error — unverified | Pending manual check before Phase 1 |
| Ixigo | ixigo.com/robots.txt | /flights/search, /search/result/ | EXCLUDED |
| EaseMyTrip | easemytrip.com/robots.txt | /flight-search/listing* | EXCLUDED |
| Cleartrip | cleartrip.com/robots.txt | /flights/search* | EXCLUDED |

## Polite Guest Rules (non-negotiable for all connectors)

1. **Delay between requests**: Minimum 3 seconds (configured at 4 seconds default)
2. **Volume cap**: Maximum 6 page loads per scraper run (3 routes x 2 advance windows)
3. **User-Agent**: Non-impersonating — identifies as APIxResearchBot/1.0 with educational purpose
4. **No booking, no login, no personal data**: Read-only fare display pages only
5. **Raw data retention**: Raw responses saved to data/raw/ for audit trail
6. **Purpose**: Educational research prototype for a government hackathon (SIH 26056) — non-commercial

## Why we use airline-direct sites instead of OTAs

All major Indian OTAs (Ixigo, EaseMyTrip, Cleartrip, MakeMyTrip) explicitly
disallow automated access to their flight search result pages in robots.txt.
Using airline-direct sites (Air India, IndiGo) is the only polite and
compliant approach available for this prototype.

This is also arguable a better methodology choice: airline-direct prices
are the source-of-truth fares. OTA prices include markup and may vary
across agents; direct airline prices are what the airline actually charges.

## Action required before Phase 1 scraping

- [ ] Manually verify goindigo.in/robots.txt in a browser
- [ ] If IndiGo disallows: check SpiceJet as alternative Source 2
- [ ] Update AGENTS.md Known Issues with the result
