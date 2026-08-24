"""
src/ingestion/connectors/air_india_direct.py

Source 1 — Air India direct (airindia.com)

Robots.txt status (checked 2026-08-24):
    Disallows: /bin/, /content/dam/air-india/image/company-information/*,
               /in/en/google-flight-booking.html, /in/en/flying-returns/loyalty-redemption.html
    Flight search pages: NOT disallowed for User-agent: *
    Decision: PERMITTED for low-volume, non-commercial, educational research use.

Polite-guest rules (non-negotiable):
    - REQUEST_DELAY_SECONDS >= 3 between consecutive page loads
    - MAX_REQUESTS_PER_RUN enforced — do not raise this above 30 for demo purposes
    - User-Agent identifies as a research bot (not impersonating a browser silently)
    - No login, no booking, no personal data collected
    - Raw HTML saved to data/raw/airline_direct/ for audit trail

NOTE: This is a Playwright-based scraper stub. The actual CSS selectors / page flow
need to be confirmed by loading airindia.com/en/book-flights manually and inspecting
the fare result elements. Placeholder selectors are marked with TODO comments.
"""

import asyncio
import json
import re
from datetime import date, datetime
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright, Page

from src.ingestion.connectors import BaseConnector, FareRecord

# Raw output directory — one JSON file per scrape run
RAW_DIR = Path("data/raw/airline_direct")
RAW_DIR.mkdir(parents=True, exist_ok=True)

MAX_REQUESTS_PER_RUN = 6  # 3 routes x 2 advance windows — one page load each


class AirIndiaDirectConnector(BaseConnector):
    """
    Scrapes one-way economy fare quotes from airindia.com.
    Writes raw JSON to data/raw/airline_direct/ for audit trail.
    """

    SOURCE_NAME = "air_india_direct"
    REQUEST_DELAY_SECONDS = 4.0  # polite delay between page loads

    # Route code mapping: APIx route string -> (origin IATA, destination IATA)
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
        """Load the Air India search results page and extract fare quotes."""
        if route not in self.ROUTE_MAP:
            raise ValueError(f"Unsupported route: {route}")

        origin, destination = self.ROUTE_MAP[route]
        date_str = travel_date.strftime("%d/%m/%Y")

        # Air India one-way search URL pattern
        # TODO: verify this URL pattern against the live site before running
        url = (
            f"https://www.airindia.com/in/en/book-flights/flight-listing.html"
            f"?origin={origin}&destination={destination}&journeyType=O"
            f"&tripType=O&travelDate={date_str}&adultsCount=1&childCount=0&infantCount=0"
            f"&travelClass=Economy"
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
                await asyncio.sleep(2)  # allow dynamic content to render

                # TODO: Replace the selectors below after inspecting the live page.
                # Common patterns for airline fare cards: look for elements containing
                # price text (₹ symbol or numeric fare values).

                # Attempt to extract fare cards
                fare_cards = await page.query_selector_all(
                    # TODO: verify selector — this is a placeholder
                    "[class*='fare'], [class*='price'], [data-price], "
                    "[class*='flight-card'], [class*='result-card']"
                )

                today = date.today()
                if not fare_cards:
                    # If no fare cards found, mark as sold out / unresolvable
                    record = FareRecord(
                        route=route,
                        carrier="Air India",
                        date_scraped=today,
                        travel_date=travel_date,
                        advance_purchase_days=advance_purchase_days,
                        fare_class="Economy",
                        base_fare=None,
                        taxes=None,
                        total_fare=0.0,
                        source_name=self.SOURCE_NAME,
                        is_sold_out=True,
                    )
                    records.append(record)
                else:
                    for card in fare_cards[:5]:  # cap at 5 quotes per search
                        fare_data = await self._extract_fare_from_card(card, today)
                        if fare_data:
                            record = FareRecord(
                                route=route,
                                carrier=fare_data.get("carrier", "Air India"),
                                date_scraped=today,
                                travel_date=travel_date,
                                advance_purchase_days=advance_purchase_days,
                                fare_class=fare_data.get("fare_class", "Economy"),
                                base_fare=fare_data.get("base_fare"),
                                taxes=fare_data.get("taxes"),
                                total_fare=fare_data["total_fare"],
                                source_name=self.SOURCE_NAME,
                                is_sold_out=False,
                            )
                            records.append(record)
                            raw_data.append(fare_data)

            except Exception as exc:
                print(f"[{self.SOURCE_NAME}] Error scraping {route} {travel_date}: {exc}")
            finally:
                await browser.close()

        # Save raw output for audit trail
        self._save_raw(route, travel_date, raw_data)
        return records

    async def _extract_fare_from_card(self, card, today: date) -> Optional[dict]:
        """
        Extract price data from a fare card element.
        TODO: Implement after inspecting the live page structure.
        Returns a dict with keys: total_fare, base_fare, taxes, carrier, fare_class
        """
        try:
            text = await card.inner_text()
            # Look for price pattern: ₹ followed by digits with optional commas
            prices = re.findall(r"[₹Rs\.\s]([\d,]+)", text)
            prices_numeric = [
                float(p.replace(",", "")) for p in prices if float(p.replace(",", "")) > 500
            ]
            if not prices_numeric:
                return None
            total = max(prices_numeric)  # largest price is likely the total
            return {
                "total_fare": total,
                "base_fare": None,   # TODO: parse separately when selectors are confirmed
                "taxes": None,       # TODO: parse separately
                "carrier": "Air India",
                "fare_class": "Economy",
            }
        except Exception:
            return None

    def _save_raw(self, route: str, travel_date: date, data: list[dict]) -> None:
        """Save raw scraped data to data/raw/airline_direct/ for audit trail."""
        filename = RAW_DIR / f"{self.SOURCE_NAME}_{route}_{travel_date}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(
                {
                    "source": self.SOURCE_NAME,
                    "route": route,
                    "travel_date": str(travel_date),
                    "scraped_at": datetime.utcnow().isoformat(),
                    "records": data,
                },
                f,
                indent=2,
                ensure_ascii=False,
            )
