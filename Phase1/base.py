"""
Connector base.

Two invariants the whole system rests on:

1. No connector can perform a network fetch without a Decision from RobotsGate.
   `fetch()` calls `gate.authorize()` first; there is no flag to skip it.

2. Every FareRecord carries an origin of 'observed' or 'imputed', and the value
   is set by the machinery, not by the connector author. `LiveConnector` can only
   emit 'observed'. This is what breaks the circular-validation problem: an
   imputed row is structurally incapable of reaching the published index or the
   backtest.
"""

from __future__ import annotations

import hashlib
import json
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any, Iterator, Literal

from src.compliance.robots_gate import Decision, RobotsDenied, RobotsGate

Origin = Literal["observed", "imputed"]
RAW_ARCHIVE = Path("data/raw")


@dataclass
class Provenance:
    """Everything needed to reconstruct where a number came from, months later."""

    origin: Origin
    source_name: str
    channel: Literal["licensed_api", "permitted_scrape", "official_publication", "model"]
    fetched_at: datetime
    request_url: str | None = None
    http_status: int | None = None
    raw_sha256: str | None = None
    raw_archive_path: str | None = None
    robots_decision: dict | None = None
    provider_reference: str | None = None
    notes: str | None = None

    def to_json(self) -> str:
        d = asdict(self)
        d["fetched_at"] = self.fetched_at.isoformat()
        return json.dumps(d, default=str)


@dataclass
class FareRecord:
    route: str
    travel_date: date
    advance_purchase_days: int
    carrier: str
    total_fare: Decimal
    currency: str
    provenance: Provenance
    base_fare: Decimal | None = None
    taxes: Decimal | None = None
    yq_surcharge: Decimal | None = None
    psf_fee: Decimal | None = None
    udf_fee: Decimal | None = None
    convenience_fee: Decimal | None = None
    gst: Decimal | None = None
    fare_class: str | None = None
    is_sold_out: bool = False
    is_cancelled: bool = False
    quote_id: str = field(default_factory=lambda: str(uuid.uuid4()))

    def __post_init__(self):
        if self.total_fare is not None and self.total_fare <= 0 and not self.is_sold_out:
            raise ValueError(f"non-positive fare {self.total_fare} for {self.route}")
        if self.advance_purchase_days < 0:
            raise ValueError("advance_purchase_days must be >= 0")

    @property
    def origin(self) -> Origin:
        return self.provenance.origin


class BaseConnector(ABC):
    """Common plumbing. Do not subclass directly -- use LiveConnector."""

    source_name: str
    channel: str

    def __init__(self, gate: RobotsGate, archive_dir: Path = RAW_ARCHIVE):
        self.gate = gate
        self.archive_dir = archive_dir
        self.archive_dir.mkdir(parents=True, exist_ok=True)
        self.skipped: list[Decision] = []

    def fetch(self, url: str, *, method: str = "GET", **kwargs) -> tuple[Any, Provenance]:
        """
        Authorised fetch. Raises RobotsDenied if the gate refuses -- callers that
        want a soft skip should use `try_fetch`.
        """
        decision = self.gate.authorize(url)
        self.gate.wait_for_slot(url, decision)

        resp = self.gate._client.request(method, url, **kwargs)
        body = resp.content
        digest = hashlib.sha256(body).hexdigest()
        archive_path = self.archive_dir / f"{self.source_name}_{digest[:16]}.raw"
        archive_path.write_bytes(body)

        prov = Provenance(
            origin="observed",
            source_name=self.source_name,
            channel=self.channel,  # type: ignore[arg-type]
            fetched_at=datetime.now(timezone.utc),
            request_url=url,
            http_status=resp.status_code,
            raw_sha256=digest,
            raw_archive_path=str(archive_path),
            robots_decision=decision.as_audit_row(),
        )
        return resp, prov

    def try_fetch(self, url: str, **kwargs) -> tuple[Any, Provenance] | None:
        """Fetch, or record the refusal and return None. Never fabricates a result."""
        try:
            return self.fetch(url, **kwargs)
        except RobotsDenied as exc:
            self.skipped.append(exc.decision)
            return None

    @abstractmethod
    def collect(self, routes: list[str], advance_days: list[int]) -> Iterator[FareRecord]:
        ...


class LiveConnector(BaseConnector):
    """
    A connector that only ever emits observed data.

    If it cannot observe a fare, it yields nothing. It does not fall back, does
    not interpolate, and does not substitute a calibrated value. A gap in the
    series is a true statement about the world; a filled gap is a lie about it.
    """

    def emit(self, prov: Provenance, **fields) -> FareRecord:
        if prov.origin != "observed":
            raise ValueError("LiveConnector may only emit observed records")
        return FareRecord(provenance=prov, **fields)
