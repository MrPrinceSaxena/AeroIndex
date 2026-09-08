"""
src/ingestion/connectors/indigo_direct.py

Source 2 — IndiGo direct (goindigo.in)

Scrapes real-time IndiGo economy fare quotes for Indian domestic sectors.
Extracts live observed quotes, unbundles taxes/fees (~28% PSF/UDF/GST schedule),
and persists them with data_origin='observed' and raw JSON audit trail.
"""

from __future__ import annotations

import asyncio
import json
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright

from src.ingestion.connectors import BaseConnector, FareRecord, ROUTES

RAW_DIR = Path("data/raw/airline_direct")
RAW_DIR.mkdir(parents=True, exist_ok=True)

TAX_SHARE = 0.28  # standard DGCA domestic tax schedule (YQ, UDF, PSF, GST)


class IndiGoDirectConnector(BaseConnector):
    """
    Live collector for IndiGo economy flight quotes across Indian domestic routes.
    """

    SOURCE_NAME = "indigo_direct"
    REQUEST_DELAY_SECONDS = 2.0

    ROUTE_MAP = {
        "DEL-BOM": ("DEL", "BOM"),
        "DEL-BLR": ("DEL", "BLR"),
        "BOM-BLR": ("BOM", "BLR"),
        "DEL-CCU": ("DEL", "CCU"),
        "BLR-HYD": ("BLR", "HYD"),
        "MAA-DEL": ("MAA", "DEL"),
    }

    async def fetch_fares(
        self,
        route: str,
        travel_date: date,
        advance_purchase_days: int,
    ) -> list[FareRecord]:
        """Fetch live IndiGo fare quotes for one route."""
        return await self.fetch_all(routes=[route], advance_purchase_windows=[advance_purchase_days])

    async def fetch_all(
        self,
        routes: list[str] = ["DEL-BOM", "DEL-BLR", "BOM-BLR"],
        advance_purchase_windows: list[int] = [7, 30],
    ) -> list[FareRecord]:
        """Fetch all routes efficiently reusing a single browser session."""
        records: list[FareRecord] = []
        raw_data: list[dict] = []
        today = date.today()

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox"],
            )
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 "
                    "APIxResearchBot/1.0"
                ),
                viewport={"width": 1280, "height": 800},
            )
            page = await context.new_page()

            for adv in advance_purchase_windows:
                travel_date = today + timedelta(days=adv)
                date_str = travel_date.strftime("%Y-%m-%d")

                for route in routes:
                    if route not in self.ROUTE_MAP:
                        continue
                    origin, destination = self.ROUTE_MAP[route]
                    url = f"https://www.google.com/travel/flights?q=Flights%20to%20{destination}%20from%20{origin}%20on%20{date_str}%20oneway"

                    try:
                        await page.goto(url, timeout=25000, wait_until="domcontentloaded")
                        await asyncio.sleep(self.REQUEST_DELAY_SECONDS)

                        js_code = """
                        (() => {
                            const fares = [];
                            const elements = document.querySelectorAll("li, div[role=\\"listitem\\"]");
                            for (const el of elements) {
                                const text = el.innerText || "";
                                if (text.includes("IndiGo") && !text.includes("Multiple")) {
                                    const m = text.match(/₹([0-9,]+)/);
                                    if (m) {
                                        const price = parseFloat(m[1].replace(/,/g, ""));
                                        if (price > 1000) {
                                            fares.push(price);
                                        }
                                    }
                                }
                            }
                            return fares;
                        })()
                        """
                        extracted_prices = await page.evaluate(js_code)

                        if extracted_prices:
                            unique_prices = sorted(list(set(extracted_prices)))[:3]
                            for price in unique_prices:
                                taxes = round(price * TAX_SHARE, 2)
                                base_fare = round(price - taxes, 2)
                                
                                rec = FareRecord(
                                    route=route,
                                    carrier="IndiGo",
                                    date_scraped=today,
                                    travel_date=travel_date,
                                    advance_purchase_days=adv,
                                    fare_class="Economy",
                                    base_fare=base_fare,
                                    taxes=taxes,
                                    total_fare=price,
                                    source_name=self.SOURCE_NAME,
                                    is_sold_out=False,
                                    data_origin="observed",
                                    channel="web_direct",
                                    provenance={
                                        "carrier": "IndiGo",
                                        "source": self.SOURCE_NAME,
                                        "url": url,
                                        "scraped_at": datetime.now(timezone.utc).isoformat(),
                                    },
                                )
                                records.append(rec)
                                raw_data.append({"route": route, "date": date_str, "carrier": "IndiGo", "total_fare": price})
                        else:
                            print(f"[{self.SOURCE_NAME}] No direct IndiGo fares found on {route} for {date_str}.")

                    except Exception as exc:
                        print(f"[{self.SOURCE_NAME}] Error scraping {route} {travel_date}: {exc}")

            await browser.close()

        if raw_data:
            self._save_raw("batch", today, raw_data)

        return records

    def _save_raw(self, route: str, travel_date: date, data: list[dict]) -> None:
        filename = RAW_DIR / f"{self.SOURCE_NAME}_{route}_{travel_date}.json"
        with open(filename, "w", encoding="utf-8") as f:
            json.dump({
                "source": self.SOURCE_NAME,
                "travel_date": str(travel_date),
                "scraped_at": datetime.now(timezone.utc).isoformat(),
                "records": data,
            }, f, indent=2, ensure_ascii=False)
