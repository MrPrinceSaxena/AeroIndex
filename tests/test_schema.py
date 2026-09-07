"""
tests/test_schema.py

Phase 0 validation tests — verify schema compliance and connector interface.
Run: pytest tests/ -v
"""

import pytest
from datetime import date
from src.ingestion.connectors import FareRecord, ROUTES, ADVANCE_PURCHASE_DAYS
from src.ingestion.synthetic_generator import generate_synthetic_record, DGCA_ROUTE_MEANS
from src.index_engine.weights import get_route_weights


class TestFareRecord:
    def test_valid_record(self):
        record = FareRecord(
            route="DEL-BOM",
            carrier="Air India",
            date_scraped=date(2024, 8, 1),
            travel_date=date(2024, 8, 8),
            advance_purchase_days=7,
            fare_class="Economy",
            base_fare=4200.00,
            taxes=1600.00,
            total_fare=5800.00,
            source_name="air_india_direct",
        )
        assert record.source_name == "air_india_direct"
        assert record.route == "DEL-BOM"
        assert record.total_fare == 5800.00

    def test_invalid_route_raises(self):
        with pytest.raises(ValueError, match="Invalid route"):
            FareRecord(
                route="DEL-CCU",  # not in our 3-route basket
                carrier=None,
                date_scraped=date(2024, 8, 1),
                travel_date=date(2024, 8, 8),
                advance_purchase_days=7,
                fare_class=None,
                base_fare=None,
                taxes=None,
                total_fare=5000.00,
                source_name="air_india_direct",
            )

    def test_invalid_advance_days_raises(self):
        with pytest.raises(ValueError, match="Invalid advance_purchase_days"):
            FareRecord(
                route="DEL-BOM",
                carrier=None,
                date_scraped=date(2024, 8, 1),
                travel_date=date(2024, 8, 8),
                advance_purchase_days=14,  # not 7 or 30
                fare_class=None,
                base_fare=None,
                taxes=None,
                total_fare=5000.00,
                source_name="air_india_direct",
            )

    def test_empty_source_name_raises(self):
        with pytest.raises(ValueError, match="source_name is required"):
            FareRecord(
                route="DEL-BOM",
                carrier=None,
                date_scraped=date(2024, 8, 1),
                travel_date=date(2024, 8, 8),
                advance_purchase_days=7,
                fare_class=None,
                base_fare=None,
                taxes=None,
                total_fare=5000.00,
                source_name="",  # must not be empty
            )


class TestSyntheticGenerator:
    def test_synthetic_source_name(self):
        """Synthetic records must ALWAYS have source_name = synthetic_estimate."""
        for route in ROUTES:
            for adv in ADVANCE_PURCHASE_DAYS:
                record = generate_synthetic_record(
                    route=route,
                    travel_date=date(2024, 9, 1),
                    advance_purchase_days=adv,
                    seed=42,
                )
                assert record.source_name == "synthetic_estimate", (
                    f"Synthetic record for {route} T+{adv} has wrong source_name: "
                    f"{record.source_name}"
                )

    def test_synthetic_fare_reasonable(self):
        """Synthetic fares should be in a plausible range around DGCA means."""
        for route in ROUTES:
            record = generate_synthetic_record(
                route=route,
                travel_date=date(2024, 9, 1),
                advance_purchase_days=7,
                seed=42,
            )
            mean = DGCA_ROUTE_MEANS[route]
            assert mean * 0.5 < record.total_fare < mean * 2.0, (
                f"Synthetic fare for {route} = {record.total_fare} is outside "
                f"plausible range [{mean*0.5}, {mean*2.0}]"
            )


class TestWeights:
    """
    Weights are now DB-loaded via route_basket. These tests verify:
    1. The override path works (tests inject explicit weights).
    2. The function contract is correct (sum to 1, routes match).
    DB-loading is not testable offline — that path raises RuntimeError
    when dgca_pax_annual is NULL, which is correct behaviour and the
    team will see it when they run the server without real DGCA data.
    """

    def test_override_returns_explicit_weights(self):
        test_w = {"DEL-BOM": 0.5, "DEL-BLR": 0.3, "BOM-BLR": 0.2}
        result = get_route_weights(override=test_w)
        assert result == test_w

    def test_override_weights_sum_to_one(self):
        test_w = {"DEL-BOM": 0.5, "DEL-BLR": 0.3, "BOM-BLR": 0.2}
        total = sum(get_route_weights(override=test_w).values())
        assert abs(total - 1.0) < 1e-4

    def test_none_override_would_hit_db(self, monkeypatch):
        # Without a DB connection, get_route_weights(override=None) should
        # attempt DB access and fail. This confirms no silent fallback.
        from unittest.mock import MagicMock
        monkeypatch.setattr("src.db.connection.db_connection", MagicMock(side_effect=ConnectionRefusedError("DB offline")))
        with pytest.raises(Exception):
            get_route_weights(override=None)
