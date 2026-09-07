"""
Runtime guard against circular validation.

The failure this exists to prevent: synthetic fares are calibrated to DGCA
averages, the index is computed from those fares, and the index is then
"validated" against DGCA averages. That is a tautology, and it is the single
most damaging thing a domain reviewer can find in this codebase.

The SQL view `observed_fare_quotes` is the structural fix. This module is the
belt-and-braces runtime check, plus honest coverage reporting so the dashboard
can show what fraction of the index is real without anyone having to trust a
claim.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Any, Iterable, Sequence


class CircularValidationError(AssertionError):
    """Raised when imputed data reaches the index or the backtest."""


PUBLISHED_SOURCE_VIEW = "observed_fare_quotes"


def assert_observed_only(rows: Iterable[Any], context: str) -> None:
    """
    Hard gate. Call at the top of every index and backtest routine.

    Accepts dicts, objects with .data_origin, or objects with .origin.
    """
    offenders = []
    for row in rows:
        origin = (
            row.get("data_origin") if isinstance(row, dict)
            else getattr(row, "data_origin", None) or getattr(row, "origin", None)
        )
        if origin != "observed":
            offenders.append(origin)
    if offenders:
        counts: dict[str, int] = {}
        for o in offenders:
            counts[str(o)] = counts.get(str(o), 0) + 1
        raise CircularValidationError(
            f"{context}: {len(offenders)} non-observed rows reached the computation "
            f"({counts}). Read from {PUBLISHED_SOURCE_VIEW}, not fare_quotes."
        )


def assert_query_is_quarantined(sql: str, context: str) -> None:
    """
    Cheap static check for index/backtest SQL. Catches the common regression
    where someone reverts a query to the raw table during a late-night fix.
    """
    lowered = " ".join(sql.lower().split())
    if PUBLISHED_SOURCE_VIEW in lowered:
        return
    if "fare_quotes" in lowered and "data_origin = 'observed'" not in lowered:
        raise CircularValidationError(
            f"{context}: query reads fare_quotes without an observed-only filter. "
            f"Use {PUBLISHED_SOURCE_VIEW}."
        )


@dataclass(frozen=True)
class Coverage:
    """What the dashboard should show instead of a bare index number."""

    as_of: date
    cells_expected: int          # active routes x active windows
    cells_observed: int
    quotes_observed: int
    sources_live: Sequence[str]

    @property
    def completeness(self) -> float:
        return (self.cells_observed / self.cells_expected) if self.cells_expected else 0.0

    @property
    def is_publishable(self) -> bool:
        """
        An index built on a thin grid is not wrong, it is imprecise -- and it
        should say so rather than print a confident number. Tune this threshold
        and defend it in your methodology page.
        """
        return self.completeness >= 0.60

    def as_api_block(self) -> dict:
        return {
            "as_of": self.as_of.isoformat(),
            "cells_expected": self.cells_expected,
            "cells_observed": self.cells_observed,
            "quotes_observed": self.quotes_observed,
            "completeness": round(self.completeness, 4),
            "sources_live": list(self.sources_live),
            "publishable": self.is_publishable,
            "basis": "observed fares only; imputed rows excluded from index arithmetic",
        }


COVERAGE_SQL = f"""
SELECT
    count(*)                                              AS quotes_observed,
    count(DISTINCT (route, advance_purchase_days))        AS cells_observed,
    array_agg(DISTINCT provenance->>'source_name')        AS sources_live
FROM {PUBLISHED_SOURCE_VIEW}
WHERE date_scraped::date = %(as_of)s;
"""

EXPECTED_CELLS_SQL = """
SELECT (SELECT count(*) FROM route_basket    WHERE is_active)
     * (SELECT count(*) FROM advance_window  WHERE is_active) AS cells_expected;
"""


def load_coverage(cursor, as_of: date) -> Coverage:
    cursor.execute(EXPECTED_CELLS_SQL)
    expected = cursor.fetchone()[0] or 0
    cursor.execute(COVERAGE_SQL, {"as_of": as_of})
    quotes, cells, sources = cursor.fetchone()
    return Coverage(
        as_of=as_of,
        cells_expected=expected,
        cells_observed=cells or 0,
        quotes_observed=quotes or 0,
        sources_live=[s for s in (sources or []) if s],
    )
