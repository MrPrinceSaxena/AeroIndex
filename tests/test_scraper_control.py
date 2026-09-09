"""
tests/test_scraper_control.py

Offline unit and integration tests for scraper controls, parametric execution,
live test queries, and status endpoints.
"""

from datetime import date
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.ingestion.connectors import FareRecord
from src.ingestion.run_all import scrape_live_probe, CURRENT_PIPELINE_STATUS


@pytest.fixture
def test_client():
    with TestClient(app) as c:
        yield c


def test_scraper_sources_endpoint(test_client):
    resp = test_client.get("/apix/scraper/sources")
    assert resp.status_code == 200
    data = resp.json()
    assert "sources" in data
    source_names = [s["source_name"] for s in data["sources"]]
    assert "air_india_direct" in source_names
    assert "indigo_direct" in source_names
    assert "synthetic_estimate" in source_names


def test_scraper_status_endpoint(test_client):
    resp = test_client.get("/apix/scraper/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "is_running" in data
    assert "current_step" in data
    assert "progress_pct" in data
    assert isinstance(data["logs"], list)


@pytest.mark.asyncio
async def test_live_scrape_probe_air_india_mocked():
    sample_records = [
        FareRecord(
            route="DEL-BOM",
            carrier="Air India",
            date_scraped=date.today(),
            travel_date=date.today(),
            advance_purchase_days=7,
            fare_class="Economy",
            base_fare=4500.0,
            taxes=1260.0,
            total_fare=5760.0,
            source_name="air_india_direct",
            is_sold_out=False,
            data_origin="observed",
            channel="web_direct",
            provenance={"url": "https://google.com/travel/flights"},
        )
    ]
    with patch("src.ingestion.connectors.air_india_direct.AirIndiaDirectConnector.fetch_all", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = sample_records
        res = await scrape_live_probe("Air India", "DEL-BOM", 7)
        assert res["success"] is True
        assert res["records_found"] == 1
        assert res["quotes"][0]["total_fare"] == 5760.0
        assert res["quotes"][0]["carrier"] == "Air India"


@pytest.mark.asyncio
async def test_live_scrape_probe_indigo_mocked():
    sample_records = [
        FareRecord(
            route="DEL-BLR",
            carrier="IndiGo",
            date_scraped=date.today(),
            travel_date=date.today(),
            advance_purchase_days=30,
            fare_class="Economy",
            base_fare=3800.0,
            taxes=1064.0,
            total_fare=4864.0,
            source_name="indigo_direct",
            is_sold_out=False,
            data_origin="observed",
            channel="web_direct",
            provenance={"url": "https://google.com/travel/flights"},
        )
    ]
    with patch("src.ingestion.connectors.indigo_direct.IndiGoDirectConnector.fetch_all", new_callable=AsyncMock) as mock_fetch:
        mock_fetch.return_value = sample_records
        res = await scrape_live_probe("IndiGo", "DEL-BLR", 30)
        assert res["success"] is True
        assert res["records_found"] == 1
        assert res["quotes"][0]["total_fare"] == 4864.0
        assert res["quotes"][0]["carrier"] == "IndiGo"


def test_post_scraper_test_api(test_client):
    with patch("src.api.main.scrape_live_probe", new_callable=AsyncMock) as mock_test:
        mock_test.return_value = {
            "success": True,
            "carrier": "Air India",
            "source_name": "air_india_direct",
            "route": "DEL-BOM",
            "advance_purchase_days": 7,
            "records_found": 1,
            "quotes": [{"total_fare": 5500.0, "carrier": "Air India"}],
        }
        resp = test_client.post(
            "/apix/scraper/test",
            json={"carrier": "Air India", "route": "DEL-BOM", "advance_purchase_days": 7},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["records_found"] == 1


def test_post_scraper_run_api(test_client):
    with patch("src.api.main.run_pipeline", new_callable=AsyncMock) as mock_run:
        mock_run.return_value = {"status": "success", "run_id": "test-123"}
        resp = test_client.post(
            "/apix/scraper/run",
            json={
                "sources": ["air_india_direct", "indigo_direct"],
                "routes": ["DEL-BOM"],
                "advance_windows": [7],
                "do_gap_fill": False,
                "do_cross_validation": False,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "initiated"
        assert "DEL-BOM" in data["routes"]
