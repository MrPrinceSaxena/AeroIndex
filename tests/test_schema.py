"""
tests/test_schema.py

Phase 0 validation tests — verify schema compliance and connector interface.
Run: pytest tests/ -v
"""

import pytest
from datetime import date
from src.ingestion.connectors import FareRecord, ROUTES, ADVANCE_PURCHASE_DAYS
from src.ingestion.synthetic_generator import generate_synthetic_record, DGCA_ROUTE_MEANS
from src.index_engine.weights import ROUTE_WEIGHTS


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
    def test_weights_sum_to_one(self):
        total = sum(ROUTE_WEIGHTS.values())
        assert abs(total - 1.0) < 1e-4, f"Weights sum to {total}, not 1.0"

    def test_all_routes_have_weights(self):
        for route in ROUTES:
            assert route in ROUTE_WEIGHTS, f"Route {route} missing from ROUTE_WEIGHTS"

    def test_del_bom_highest_weight(self):
        """DEL-BOM should have the highest weight (it has the most traffic)."""
        assert ROUTE_WEIGHTS["DEL-BOM"] > ROUTE_WEIGHTS["DEL-BLR"]
        assert ROUTE_WEIGHTS["DEL-BOM"] > ROUTE_WEIGHTS["BOM-BLR"]
