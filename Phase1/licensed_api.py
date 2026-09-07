"""
Licensed fare-API connector -- the primary live channel.

This makes real outbound HTTPS calls on a schedule and returns real fares quoted
for real Indian domestic sectors. It is "web scraping" in the sense the PS cares
about (automated, high-frequency, machine collection of what a traveller is
actually quoted) while being contractually authorised rather than adversarial.

IMPORTANT -- provider landscape changed in 2026:
    Amadeus decommissioned its Self-Service developer portal on 17 July 2026 and
    deactivated self-service keys; flight search now requires an Enterprise
    contract. If any tutorial or older plan in your repo assumes a free Amadeus
    key, it is dead. Current self-serve options include Duffel, Skyscanner via
    RapidAPI, FlightAPI.io and Travelpayouts; Kiwi's Tequila is invite-only.

VERIFY BEFORE YOU TRUST: the DuffelAdapter field mappings below reflect Duffel's
documented offer-request shape, but request/response schemas and version headers
change. Run `python -m src.connectors.licensed_api --selftest` on day one. It
performs one real call and prints the raw JSON so you can confirm every mapping
against what the provider actually returns. Do not skip this step.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Iterator, Protocol

from src.compliance.robots_gate import RobotsGate
from src.connectors.base import FareRecord, LiveConnector, Provenance


class ProviderAdapter(Protocol):
    """Isolates provider-specific wire format so a provider swap is one class."""

    name: str
    base_url: str

    def headers(self, api_key: str) -> dict[str, str]: ...
    def build_request(self, origin: str, destination: str, travel_date: date) -> tuple[str, str, dict | None]: ...
    def parse(self, payload: Any) -> list[dict]: ...


def _dec(value: Any) -> Decimal | None:
    if value is None or value == "":
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError):
        return None


class DuffelAdapter:
    """
    Adapter for Duffel's offer-request endpoint.

    Duffel returns base_amount and tax_amount separately, which is what makes the
    PS's fee-unbundling requirement satisfiable at all from an API channel. It
    does NOT break out UDF / PSF / convenience fee individually -- those stay
    NULL rather than being guessed. A NULL is honest; a plausible number is not.
    """

    name = "duffel"
    base_url = "https://api.duffel.com"
    api_version = "v2"

    def headers(self, api_key: str) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {api_key}",
            "Duffel-Version": self.api_version,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def build_request(self, origin: str, destination: str, travel_date: date):
        body = {
            "data": {
                "slices": [
                    {
                        "origin": origin,
                        "destination": destination,
                        "departure_date": travel_date.isoformat(),
                    }
                ],
                "passengers": [{"type": "adult"}],
                "cabin_class": "economy",
            }
        }
        return "POST", f"{self.base_url}/air/offer_requests?return_offers=true", body

    def parse(self, payload: Any) -> list[dict]:
        offers = (payload or {}).get("data", {}).get("offers", []) or []
        out = []
        for offer in offers:
            owner = (offer.get("owner") or {}).get("iata_code")
            out.append(
                {
                    "carrier": owner or "UNKNOWN",
                    "total_fare": _dec(offer.get("total_amount")),
                    "base_fare": _dec(offer.get("base_amount")),
                    "taxes": _dec(offer.get("tax_amount")),
                    "currency": offer.get("total_currency") or "INR",
                    "fare_class": offer.get("cabin_class") or None,
                    "provider_reference": offer.get("id"),
                }
            )
        return out


ADAPTERS: dict[str, type] = {"duffel": DuffelAdapter}


class LicensedApiConnector(LiveConnector):
    """
    Scheduled daily extraction across the route basket x advance-window grid.

    Emits one FareRecord per returned offer. Emits nothing for a cell that
    returns no offers -- the cell simply has no observation that day.
    """

    channel = "licensed_api"

    def __init__(
        self,
        gate: RobotsGate,
        adapter: ProviderAdapter | None = None,
        api_key: str | None = None,
        cheapest_only: bool = False,
    ):
        self.adapter = adapter or DuffelAdapter()
        self.source_name = f"api:{self.adapter.name}"
        super().__init__(gate)
        self.api_key = api_key or os.environ.get("APIX_FARE_API_KEY", "")
        if not self.api_key:
            raise RuntimeError(
                "APIX_FARE_API_KEY is not set. The engine will not start without a "
                "live credential -- there is no offline fallback by design."
            )
        self.cheapest_only = cheapest_only
        self.errors: list[dict] = []

    def _call(self, origin: str, destination: str, travel_date: date):
        method, url, body = self.adapter.build_request(origin, destination, travel_date)
        kwargs: dict[str, Any] = {"headers": self.adapter.headers(self.api_key)}
        if body is not None:
            kwargs["json"] = body
        # A licensed API endpoint is still checked against its own robots.txt.
        # Cheap, and it means the compliance story has no carve-outs.
        return self.fetch(url, method=method, **kwargs)

    def collect(self, routes: list[str], advance_days: list[int]) -> Iterator[FareRecord]:
        today = date.today()
        for route in routes:
            origin, _, destination = route.partition("-")
            if not destination:
                raise ValueError(f"route must look like DEL-BOM, got {route!r}")
            for apd in advance_days:
                travel_date = today + timedelta(days=apd)
                try:
                    resp, prov = self._call(origin, destination, travel_date)
                except Exception as exc:
                    self.errors.append(
                        {"route": route, "apd": apd, "error": f"{type(exc).__name__}: {exc}"}
                    )
                    continue

                if resp.status_code >= 400:
                    self.errors.append(
                        {"route": route, "apd": apd, "http_status": resp.status_code,
                         "body": resp.text[:400]}
                    )
                    continue

                try:
                    offers = self.adapter.parse(resp.json())
                except Exception as exc:
                    self.errors.append({"route": route, "apd": apd,
                                        "error": f"parse failure: {exc}"})
                    continue

                if self.cheapest_only:
                    priced = [o for o in offers if o.get("total_fare")]
                    offers = [min(priced, key=lambda o: o["total_fare"])] if priced else []

                for offer in offers:
                    if offer.get("total_fare") is None:
                        continue
                    prov_row = Provenance(**{**prov.__dict__,
                                             "provider_reference": offer.pop("provider_reference", None)})
                    yield self.emit(
                        prov_row,
                        route=route,
                        travel_date=travel_date,
                        advance_purchase_days=apd,
                        **offer,
                    )

    def health(self) -> dict:
        return {
            "source": self.source_name,
            "adapter": self.adapter.name,
            "errors": self.errors,
            "robots_skips": [d.as_audit_row() for d in self.skipped],
        }


def _selftest() -> int:
    """One real call. Prints raw JSON so you can verify every field mapping."""
    gate = RobotsGate()
    conn = LicensedApiConnector(gate)
    resp, prov = conn._call("DEL", "BOM", date.today() + timedelta(days=7))
    print(f"HTTP {resp.status_code}  sha256={prov.raw_sha256}  archived={prov.raw_archive_path}")
    print(f"robots decision: {json.dumps(prov.robots_decision, indent=2)}")
    print("--- RAW PROVIDER RESPONSE (verify field names against this) ---")
    print(resp.text[:4000])
    print("--- PARSED VIA ADAPTER ---")
    try:
        print(json.dumps(conn.adapter.parse(resp.json()), indent=2, default=str)[:2000])
    except Exception as exc:
        print(f"ADAPTER MAPPING IS WRONG: {exc}")
        return 1
    gate.close()
    return 0 if resp.status_code < 400 else 1


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    if ap.parse_args().selftest:
        raise SystemExit(_selftest())
