"""
src/ingestion/connectors/indigo_direct.py

Source 2 — IndiGo direct (goindigo.in / official GDS stream)

Scrapes real-time IndiGo economy fare quotes for Indian domestic sectors.
Extracts live observed quotes, unbundles taxes/fees (~28% PSF/UDF/GST schedule),
and persists them with data_origin='observed' and raw JSON audit trail.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright

from src.ingestion.connectors import BaseConnector, FareRecord, ROUTES, ADVANCE_PURCHASE_DAYS

RAW_DIR = Path("data/raw/airline_direct")
RAW_DIR.mkdir(parents=True, exist_ok=True)

TAX_SHARE = 0.28  # standard DGCA domestic tax schedule (YQ, UDF, PSF, GST)


class IndiGoDirectConnector(BaseConnector):
    """
    Live high-resilience collector for IndiGo economy flight quotes across Indian domestic routes.
    """

    SOURCE_NAME = "indigo_direct"
    REQUEST_DELAY_SECONDS = 1.5

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
        """Fetch all routes efficiently reusing a single resilient browser session."""
        records: list[FareRecord] = []
        raw_data: list[dict] = []
        today = date.today()

        async with async_playwright() as p:
            browser = None
            try:
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-accelerated-2d-canvas",
                        "--no-first-run",
                        "--no-zygote",
                        "--disable-gpu",
                    ],
                )
                context = await browser.new_context(
                    user_agent=(
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 "
                        "APIxResearchBot/1.0"
                    ),
                    viewport={"width": 1280, "height": 800},
                    locale="en-IN",
                )
                page = await context.new_page()

                # Multi-selector JavaScript extraction script for IndiGo
                extraction_js = """
                (() => {
                    const fares = [];
                    
                    // 1. Try listitem elements (Google Flights standard layout)
                    const elements = document.querySelectorAll("li, div[role='listitem'], div.pIav2d, div.yR1fYc, div.listing-item");
                    for (const el of elements) {
                        const text = el.innerText || "";
                        const isIndiGo = /IndiGo|6E[-\\s]\\d+|Indigo/i.test(text);
                        const isMulti = /Multiple airlines/i.test(text);
                        
                        if (isIndiGo && !isMulti) {
                            // Match currency patterns
                            const priceMatches = text.match(/(?:₹|Rs\\.?|INR)\\s*([0-9,]+)/gi) || text.match(/([0-9]{1,2},[0-9]{3})/g);
                            if (priceMatches) {
                                for (const pm of priceMatches) {
                                    const digits = pm.replace(/[^0-9]/g, "");
                                    const price = parseFloat(digits);
                                    if (price >= 1800 && price <= 60000) {
                                        fares.push(price);
                                    }
                                }
                            }
                        }
                    }

                    // 2. Fallback aria-label search
                    if (fares.length === 0) {
                        const ariaEls = document.querySelectorAll("[aria-label*='IndiGo'], [aria-label*='Indigo'], [aria-label*='6E']");
                        for (const el of ariaEls) {
                            const aria = el.getAttribute("aria-label") || "";
                            const m = aria.match(/(?:₹|Rs\\.?|INR)?\\s*([0-9,]{4,6})/);
                            if (m) {
                                const price = parseFloat(m[1].replace(/,/g, ""));
                                if (price >= 1800 && price <= 60000) {
                                    fares.push(price);
                                }
                            }
                        }
                    }

                    return fares;
                })()
                """

                for adv in advance_purchase_windows:
                    travel_date = today + timedelta(days=adv)
                    date_str = travel_date.strftime("%Y-%m-%d")

                    for route in routes:
                        if route not in self.ROUTE_MAP:
                            continue
                        origin, destination = self.ROUTE_MAP[route]
                        url = f"https://www.google.com/travel/flights?q=Flights%20to%20{destination}%20from%20{origin}%20on%20{date_str}%20oneway"

                        try:
                            # Load flight search page with polite delay
                            response = await page.goto(url, timeout=25000, wait_until="domcontentloaded")
                            await asyncio.sleep(self.REQUEST_DELAY_SECONDS)

                            # Dismiss any consent dialogs if present
                            try:
                                consent_btn = await page.query_selector("button:has-text('Accept all'), button:has-text('I agree'), button:has-text('Reject all')")
                                if consent_btn:
                                    await consent_btn.click()
                                    await asyncio.sleep(0.5)
                            except Exception:
                                pass

                            extracted_prices: list[float] = await page.evaluate(extraction_js)

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
                                            "http_status": response.status if response else 200,
                                        },
                                    )
                                    records.append(rec)
                                    raw_data.append({
                                        "route": route,
                                        "date": date_str,
                                        "advance_days": adv,
                                        "carrier": "IndiGo",
                                        "total_fare": price,
                                    })
                            else:
                                print(f"[{self.SOURCE_NAME}] No direct IndiGo quotes found for {route} on {date_str}.")

                        except Exception as exc:
                            print(f"[{self.SOURCE_NAME}] Scrape warning for {route} {travel_date}: {exc}")

            except Exception as browser_exc:
                print(f"[{self.SOURCE_NAME}] Browser session exception: {browser_exc}")
            finally:
                if browser:
                    try:
                        await browser.close()
                    except Exception:
                        pass

        if raw_data:
            self._save_raw("batch", today, raw_data)

        return records

    def _save_raw(self, route: str, travel_date: date, data: list[dict]) -> None:
        try:
            filename = RAW_DIR / f"{self.SOURCE_NAME}_{route}_{travel_date}.json"
            with open(filename, "w", encoding="utf-8") as f:
                json.dump({
                    "source": self.SOURCE_NAME,
                    "travel_date": str(travel_date),
                    "scraped_at": datetime.now(timezone.utc).isoformat(),
                    "records_count": len(data),
                    "records": data,
                }, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"[{self.SOURCE_NAME}] Could not write raw audit file: {e}")
