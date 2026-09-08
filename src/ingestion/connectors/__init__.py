"""
src/ingestion/connectors/__init__.py

Pluggable connector interface for APIx data sources.

Design rationale:
    Every data source (airline direct, OTA, future additions) implements BaseConnector.
    Adding a third source = create one new file that inherits this class.
    This pluggability is part of our answer to "is one source representative?" --
    it shows the architecture was designed for multi-source from the start.

Source name registry (source_name field in fare_quotes):
    'air_india_direct'  -- Air India website (Source 1)
    'indigo_direct'     -- IndiGo website (Source 2)
    'synthetic_estimate'-- Synthetic gap-filler (NEVER the main data, always labeled)
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import date
from typing import Optional


ROUTES = ["DEL-BOM", "DEL-BLR", "BOM-BLR", "DEL-CCU", "BLR-HYD", "MAA-DEL"]
ADVANCE_PURCHASE_DAYS = [1, 7, 15, 30, 45]



@dataclass
class FareRecord:
    """
    A single fare observation.
    Mirrors the fare_quotes schema exactly -- every field here maps 1:1 to a DB column.
    source_name is required and must be one of the registered values above.
    """
    route: str                       # 'DEL-BOM', 'DEL-BLR', 'BOM-BLR'
    carrier: Optional[str]
    date_scraped: date
    travel_date: date
    advance_purchase_days: int       # 7 or 30
    fare_class: Optional[str]
    base_fare: Optional[float]
    taxes: Optional[float]
    total_fare: float                # required -- this is what goes into the index
    source_name: str                 # REQUIRED -- never None, never just 'real'/'synthetic'
    is_sold_out: bool = False
    data_origin: str = "observed"    # 'observed' or 'imputed'
    channel: Optional[str] = "web_direct"
    provenance: Optional[dict] = None

    def __post_init__(self):
        if self.route not in ROUTES:
            raise ValueError(f"Invalid route: {self.route}. Must be one of {ROUTES}")
        if self.advance_purchase_days not in ADVANCE_PURCHASE_DAYS:
            raise ValueError(
                f"Invalid advance_purchase_days: {self.advance_purchase_days}. "
                f"Must be one of {ADVANCE_PURCHASE_DAYS}"
            )
        if not self.source_name:
            raise ValueError("source_name is required and must not be empty")
        if self.source_name == "synthetic_estimate" and self.data_origin == "observed":
            self.data_origin = "imputed"



class BaseConnector(ABC):
    """
    Abstract base class for all APIx data source connectors.

    To add a new source (e.g. SpiceJet, a third airline):
        1. Create a new file in src/ingestion/connectors/
        2. Subclass BaseConnector
        3. Implement fetch_fares() -- return a list of FareRecord
        4. Set SOURCE_NAME to the new source's identifier string
        5. Register the source_name in this file's module docstring

    That is all. Nothing else in the pipeline needs to change.
    """

    SOURCE_NAME: str = ""  # override in each subclass
    REQUEST_DELAY_SECONDS: float = 4.0  # polite default -- do not go below 3

    @abstractmethod
    async def fetch_fares(
        self,
        route: str,
        travel_date: date,
        advance_purchase_days: int,
    ) -> list[FareRecord]:
        """
        Fetch fare quotes for one route + travel_date combination.
        Returns a list of FareRecord (may be empty if sold out or unreachable).
        """
        ...

    async def fetch_all(
        self,
        routes: list[str] = ROUTES,
        advance_purchase_windows: list[int] = ADVANCE_PURCHASE_DAYS,
    ) -> list[FareRecord]:
        """
        Convenience method: fetch all routes x advance windows.
        Subclasses may override for source-specific batching.
        """
        import asyncio
        from datetime import timedelta

        today = date.today()
        records = []
        for adv in advance_purchase_windows:
            target_date = today + timedelta(days=adv)
            for route in routes:
                results = await self.fetch_fares(route, target_date, adv)
                records.extend(results)
                await asyncio.sleep(self.REQUEST_DELAY_SECONDS)
        return records
