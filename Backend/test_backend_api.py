import unittest
import asyncio
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestEVOptimizationBackend(unittest.TestCase):
    def test_health_endpoint(self):
        resp = client.get("/api/ev-optimization/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertIn("range_prediction", data.get("submodules", []))

    def test_dashboard_endpoint(self):
        resp = client.get("/api/ev-optimization/dashboard?userLat=6.9271&userLon=79.8612")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        dash = data.get("data", {})
        self.assertIn("estimatedRangeKm", dash)
        self.assertIn("currentSoc", dash)
        self.assertTrue(dash.get("estimatedRangeKm") > 0)

    def test_range_predict_endpoint(self):
        payload = {
            "soc": 80.0,
            "batteryCapacityKWh": 64.0,
            "speedKmH": 60.0,
            "temperatureC": 28.0,
            "energyConsumptionKWhPer100Km": 14.5,
            "acOn": True,
            "drivingMode": "Normal"
        }
        resp = client.post("/api/ev-optimization/range/predict", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertTrue(data["data"]["remainingRangeKm"] > 0)
        self.assertIn(data["data"]["source"], ["mock", "trained-model"])

    def test_queue_predict_endpoint(self):
        payload = {
            "stationId": "CS-CMB-001",
            "totalChargers": 4,
            "currentlyOccupied": 3,
            "arrivalHour": 17,
            "dayOfWeek": 3
        }
        resp = client.post("/api/ev-optimization/queue/predict", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data["data"]["stationId"], "CS-CMB-001")
        self.assertTrue(data["data"]["estimatedWaitMinutes"] >= 0)

    def test_stations_list_endpoint(self):
        resp = client.get("/api/ev-optimization/stations")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        stations = data.get("data", [])
        self.assertGreater(len(stations), 0)
        # Check suitability score exists
        self.assertIn("suitabilityScore", stations[0])

    def test_station_filtering(self):
        # Filter by min power 120kW
        resp = client.get("/api/ev-optimization/stations?minPowerKw=120")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        stations = data.get("data", [])
        for st in stations:
            max_kw = max(p.get("powerKw", 0) for p in st.get("ports", []))
            self.assertGreaterEqual(max_kw, 120)

    def test_station_available_only_filter(self):
        # Test with availableOnly=true
        resp_avail = client.get("/api/ev-optimization/stations?availableOnly=true")
        self.assertEqual(resp_avail.status_code, 200)
        data_avail = resp_avail.json()
        self.assertTrue(data_avail.get("success"))
        stations_avail = data_avail.get("data", [])
        self.assertGreater(len(stations_avail), 0)
        for st in stations_avail:
            total_avail = sum(p.get("available", 0) for p in st.get("ports", []))
            self.assertGreater(total_avail, 0, f"Station {st.get('stationId')} has 0 available stalls but was returned with availableOnly=true")

        # Test with availableOnly=false preserves default behavior
        resp_all = client.get("/api/ev-optimization/stations?availableOnly=false")
        self.assertEqual(resp_all.status_code, 200)
        data_all = resp_all.json()
        self.assertTrue(data_all.get("success"))
        self.assertGreaterEqual(len(data_all.get("data", [])), len(stations_avail))

    def test_station_by_id(self):
        resp = client.get("/api/ev-optimization/stations/CS-CMB-001")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data["data"]["stationId"], "CS-CMB-001")

    def test_recommendations_endpoint(self):
        resp = client.get("/api/ev-optimization/recommendations?limit=2")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertLessEqual(len(data.get("data", [])), 2)

    def test_route_optimization(self):
        payload = {
            "originLat": 6.9271,
            "originLon": 79.8612,
            "originName": "Colombo",
            "destLat": 6.0535,
            "destLon": 80.2210,
            "destName": "Galle",
            "currentSoc": 25.0,  # Low SoC to trigger charging recommendation
            "batteryCapacityKWh": 60.0,
            "consumptionKWhPer100Km": 16.0
        }
        resp = client.post("/api/ev-optimization/route/optimize", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        route = data.get("data", {})
        self.assertTrue(route.get("isChargingRequired"))
        self.assertGreater(len(route.get("recommendedChargingStops", [])), 0)

    def test_charging_estimator(self):
        payload = {
            "batteryCapacityKWh": 64.0,
            "currentSoc": 20.0,
            "targetSoc": 80.0,
            "chargerPowerKw": 50.0,
            "efficiency": 0.90
        }
        resp = client.post("/api/ev-optimization/charging/estimate", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data["data"]["energyRequiredKWh"], 38.4)
        self.assertTrue(data["data"]["chargingDurationMinutes"] > 0)

    def test_cost_analysis(self):
        payload = {
            "energyKWh": 30.0,
            "pricePerKWh": 0.35,
            "taxRate": 0.08,
            "serviceFee": 1.50
        }
        resp = client.post("/api/ev-optimization/cost/estimate", json=payload)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data["data"]["totalSessionCost"], 12.84)

    def test_monthly_cost_summary(self):
        resp = client.get("/api/ev-optimization/cost/monthly")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data.get("success"))
        self.assertGreater(data["data"]["totalSessions"], 0)

if __name__ == "__main__":
    unittest.main()
