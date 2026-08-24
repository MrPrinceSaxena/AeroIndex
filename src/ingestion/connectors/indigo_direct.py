"""
src/ingestion/connectors/indigo_direct.py

Source 2 — IndiGo direct (goindigo.in)

Robots.txt status (checked 2026-08-24):
    UNVERIFIED — server returned an error when fetched programmatically.
    ACTION REQUIRED before running this connector:
        1. Open https://www.goindigo.in/robots.txt in a browser
        2. Check whether /flight-listing or fare search pages are disallowed
        3. Update AGENTS.md Known Issues section with the result
        4. If disallowed: do NOT run this connector — use SpiceJet fallback instead

Polite-guest rules (same as air_india_direct.py — non-negotiable):
    - REQUEST_DELAY_SECONDS >= 3 between consecutive page loads
    - MAX_REQUESTS_PER_RUN = 6 (3 routes x 2 windows)
    - Non-impersonating User-Agent
    - Raw HTML/JSON saved to data/raw/ota/ for audit trail

NOTE: Selectors below are stubs. Confirm by loading goindigo.in manually.
"""

import asyncio
import json
import re
from datetime import date, datetime
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright

from src.ingestion.connectors import BaseConnector, FareRecord

RAW_DIR = Path("data/raw/ota")
RAW_DIR.mkdir(parents=True, exist_ok=True)

MAX_REQUESTS_PER_RUN = 6


class IndiGoDirectConnector(BaseConnector):
    """
    Scrapes one-way economy fare quotes from goindigo.in.
    IMPORTANT: Verify robots.txt before first run — see module docstring.
    """

    SOURCE_NAME = "indigo_direct"
    REQUEST_DELAY_SECONDS = 4.0

    ROUTE_MAP = {
        "DEL-BOM": ("DEL", "BOM"),
        "DEL-BLR": ("DEL", "BLR"),
        "BOM-BLR": ("BOM", "BLR"),
    }

    async def fetch_fares(
        self,
        route: str,
        travel_date: date,
        advance_purchase_days: int,
    ) -> list[FareRecord]:
        """Load IndiGo search results and extract fare quotes."""
        if route not in self.ROUTE_MAP:
            raise ValueError(f"Unsupported route: {route}")

        origin, destination = self.ROUTE_MAP[route]
        # IndiGo URL format — TODO: verify against live site
        date_str = travel_date.strftime("%Y-%m-%d")
        url = (
            f"https://www.goindigo.in/flight-listing.html"
            f"?origin={origin}&destination={destination}&journeyType=O"
            f"&departDate={date_str}&noOfAdults=1&noOfChildren=0&noOfInfants=0"
        )

        records: list[FareRecord] = []
        raw_data: list[dict] = []

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox"],
            )
            context = await browser.new_context(
                user_agent=(
                    "APIxResearchBot/1.0 (SIH26056; educational non-commercial use; "
                    "contact: apix-team@example.com)"
                ),
                viewport={"width": 1280, "height": 800},
            )
            page = await context.new_page()

            try:
                await page.goto(url, timeout=30_000, wait_until="networkidle")
                await asyncio.sleep(2)

                # TODO: Replace with confirmed selectors after inspecting live page
                fare_cards = await page.query_selector_all(
                    "[class*='fare'], [class*='price-block'], "
                    "[class*='flight-result'], [data-fare]"
                )

                today = date.today()
                if not fare_cards:
                    records.append(FareRecord(
                        route=route, carrier="IndiGo",
                        date_scraped=today, travel_date=travel_date,
                        advance_purchase_days=advance_purchase_days,
                        fare_class="Economy",
                        base_fare=None, taxes=None, total_fare=0.0,
                        source_name=self.SOURCE_NAME, is_sold_out=True,
                    ))
                else:
                    for card in fare_cards[:5]:
                        fare_data = await self._extract_fare_from_card(card)
                        if fare_data:
                            records.append(FareRecord(
                                route=route,
                                carrier=fare_data.get("carrier", "IndiGo"),
                                date_scraped=today,
                                travel_date=travel_date,
                                advance_purchase_days=advance_purchase_days,
                                fare_class=fare_data.get("fare_class", "Economy"),
                                base_fare=fare_data.get("base_fare"),
                                taxes=fare_data.get("taxes"),
                                total_fare=fare_data["total_fare"],
                                source_name=self.SOURCE_NAME,
                                is_sold_out=False,
                            ))
                            raw_data.append(fare_data)

            except Exception as exc:
                print(f"[{self.SOURCE_NAME}] Error scraping {route} {travel_date}: {exc}")
            finally:
                await browser.close()

        self._save_raw(route, travel_date, raw_data)
        return records

    async def _extract_fare_from_card(self, card) -> Optional[dict]:
        """Extract price data from a fare card. TODO: confirm selectors on live site."""
        try:
            text = await card.inner_text()
            prices = re.findall(r"[₹Rs\.\s]([\d,]+)", text)
            prices_numeric = [
                float(p.replace(",", "")) for p in prices if float(p.replace(",", "")) > 500
            ]
            if not prices_numeric:
                return None
            return {
                "total_fare": max(prices_numeric),
                "base_fare": None,
                "taxes": None,
                "carrier": "IndiGo",
                "fare_class": "Economy",
            }
        except Exception:
            return None

    def _save_raw(self, route: str, travel_date: date, data: list[dict]) -> None:
        filename = RAW_DIR / f"{self.SOURCE_NAME}_{route}_{travel_date}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump({
                "source": self.SOURCE_NAME,
                "route": route,
                "travel_date": str(travel_date),
                "scraped_at": datetime.utcnow().isoformat(),
                "records": data,
            }, f, indent=2, ensure_ascii=False)
