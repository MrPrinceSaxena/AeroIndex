"""
src/index_engine/weights.py

DGCA-derived route weights for the APIx index.

IMPORTANT: These weights MUST be derived from a verifiable DGCA extract, not
from constants written from memory. The acceptance criterion is:

    1. The team downloads the actual city-pair monthly domestic passenger
       tables from DGCA's monthly statistics portal or OpenCity.
    2. The file is checked into data/dgca/ with a SHA-256.
    3. dgca_source_citation in route_basket points at this file.
    4. This module loads weights from route_basket at runtime.
    5. If any active route has NULL dgca_pax_annual, this module raises
       RuntimeError. There is no silent fallback.

Why traffic-weighted instead of a naive average:
    A simple average treats DEL-BOM and BOM-BLR as equally important to Indian
    aviation inflation — but DEL-BOM carries far more passengers than BOM-BLR.
    Weighting by actual traffic means a fare spike on a high-volume route has the
    proportional impact on the index that it has on actual travellers.
    This is the same logic behind why the CPI weights food more than luxury goods:
    the weight should reflect how much of the market that item represents.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def load_route_weights_from_db() -> dict[str, float]:
    """
    Load route weights from route_basket in Postgres.

    Raises RuntimeError if:
      - No active routes exist
      - Any active route has NULL dgca_pax_annual
      - Weights do not sum to ~1.0
    """
    # Import here to avoid circular imports and to allow tests to skip DB.
    from src.db.connection import db_connection

    with db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT route, dgca_pax_annual, dgca_source_citation
                FROM route_basket
                WHERE is_active = TRUE
                ORDER BY route;
            """)
            rows = cur.fetchall()

    if not rows:
        raise RuntimeError(
            "No active routes in route_basket. "
            "Run migrations/002_provenance_and_unlock.sql first."
        )

    # Verify every active route has a real pax number.
    missing = [route for route, pax, _ in rows if pax is None]
    if missing:
        raise RuntimeError(
            f"Active routes with NULL dgca_pax_annual: {missing}. "
            f"Download the actual DGCA city-pair passenger statistics, check "
            f"the file into data/dgca/, and UPDATE route_basket with real numbers. "
            f"The index cannot run on unverified weights."
        )

    # Verify every active route has a citation.
    uncited = [route for route, _, citation in rows if not citation]
    if uncited:
        raise RuntimeError(
            f"Active routes with NULL/empty dgca_source_citation: {uncited}. "
            f"Every weight must be traceable to a checked-in DGCA extract."
        )

    total_pax = sum(pax for _, pax, _ in rows)
    if total_pax == 0:
        raise RuntimeError("Total passenger count across active routes is zero.")

    weights = {route: round(pax / total_pax, 6) for route, pax, _ in rows}

    # Sanity check: weights should sum to ~1.0
    weight_sum = sum(weights.values())
    if abs(weight_sum - 1.0) > 1e-3:
        raise RuntimeError(
            f"Route weights sum to {weight_sum:.6f}, expected ~1.0. "
            f"Check dgca_pax_annual values in route_basket."
        )

    return weights


def get_route_weights(
    override: Optional[dict[str, float]] = None,
) -> dict[str, float]:
    """
    Get route weights for index computation.

    Args:
        override: Explicit weights dict for testing. When provided, DB is
                  not consulted. This is the ONLY way to bypass the DB
                  requirement — and it is only used in tests, never in
                  production code paths.

    Returns:
        Dict mapping route codes to normalised weights summing to ~1.0.
    """
    if override is not None:
        return override
    return load_route_weights_from_db()


# ---------------------------------------------------------------------------
# Legacy compatibility: ROUTE_WEIGHTS and DGCA_PAX_MILLIONS
#
# These existed as module-level constants in the original weights.py. Several
# modules (compute_index.py, analytics.py, main.py) import them at the top
# level. Rather than breaking those imports immediately (which would cascade
# across 10+ files and all their tests), we provide them as lazy-loaded
# properties via a module-level object.
#
# In the runtime path (FastAPI, scheduler), these resolve to DB-loaded weights
# and raise RuntimeError if dgca_pax_annual is NULL — which is correct.
#
# In the test path, existing tests that import ROUTE_WEIGHTS will fail with
# RuntimeError because the DB is not available. Those tests must be updated
# to inject weights explicitly. Each such test failure is deliberate and
# is fixed in the test audit below.
# ---------------------------------------------------------------------------

class _LazyWeights:
    """
    Module-level lazy loader. On first attribute access in a runtime context,
    loads from DB. Raises RuntimeError if weights are unavailable (correct
    behaviour — forces the team to check in real DGCA data).
    """
    _loaded: Optional[dict[str, float]] = None

    def _ensure(self):
        if self._loaded is None:
            self._loaded = load_route_weights_from_db()

    def __getitem__(self, key):
        self._ensure()
        return self._loaded[key]

    def __iter__(self):
        self._ensure()
        return iter(self._loaded)

    def __len__(self):
        self._ensure()
        return len(self._loaded)

    def items(self):
        self._ensure()
        return self._loaded.items()

    def keys(self):
        self._ensure()
        return self._loaded.keys()

    def values(self):
        self._ensure()
        return self._loaded.values()

    def get(self, key, default=None):
        self._ensure()
        return self._loaded.get(key, default)


ROUTE_WEIGHTS = _LazyWeights()

# DGCA_PAX_MILLIONS is no longer a reliable constant — it was the source of
# the fabricated numbers. It is kept as a lazy loader that reads from DB for
# any code that still imports it, but it will fail if the DB has NULL pax.
class _LazyPax:
    _loaded: Optional[dict[str, float]] = None

    def _ensure(self):
        if self._loaded is None:
            from src.db.connection import db_connection
            with db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT route, dgca_pax_annual
                        FROM route_basket WHERE is_active = TRUE ORDER BY route;
                    """)
                    rows = cur.fetchall()
            missing = [r for r, p in rows if p is None]
            if missing:
                raise RuntimeError(
                    f"Cannot load DGCA_PAX_MILLIONS: routes with NULL pax: {missing}"
                )
            self._loaded = {r: p / 1_000_000 for r, p in rows}

    def __getitem__(self, key):
        self._ensure()
        return self._loaded[key]

    def items(self):
        self._ensure()
        return self._loaded.items()

    def values(self):
        self._ensure()
        return self._loaded.values()

    def keys(self):
        self._ensure()
        return self._loaded.keys()


DGCA_PAX_MILLIONS = _LazyPax()
