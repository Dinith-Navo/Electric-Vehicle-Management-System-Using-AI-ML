import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_system_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "components" in data

def test_system_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "anomaly_detection" in data["components"]
    assert "battery_health" in data["components"]
    assert "charging_optimization" in data["components"]
    assert "virtual_assistant" in data["components"]

# ==============================================================================
# COMPONENT 1: Anomaly Detection Endpoints
# ==============================================================================

def test_anomaly_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["status"] == "ONLINE"

def test_anomaly_prediction():
    payload = {
        "vehicleId": "EV-001",
        "batteryVoltage": 350.0,
        "batteryCurrent": 45.0,
        "batteryTemperature": 32.0,
        "motorTemperature": 50.0,
        "vehicleSpeed": 60.0,
        "acceleration": 0.5,
        "powerConsumption": 15.0,
        "soc": 75.0,
        "chargingStatus": "NOT_CHARGING"
    }
    response = client.post("/api/v1/anomaly/detect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "anomalyScore" in data["data"]
    assert "severity" in data["data"]

def test_anomaly_research_model_comparison():
    response = client.get("/api/v1/research/model-comparison")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "models" in data["data"]
    assert len(data["data"]["models"]) == 3

def test_anomaly_ablation():
    response = client.get("/api/v1/research/ablation")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

# ==============================================================================
# COMPONENT 2: Battery Health Prediction Endpoints
# ==============================================================================

def test_battery_status():
    response = client.get("/api/battery/status")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data

def test_battery_predict():
    payload = {
        "current_soh": 92.5,
        "battery_age_months": 14.0,
        "avg_voltage": 395.0,
        "avg_current": 42.0,
        "avg_temperature": 28.5,
        "avg_soc_change": 45.0,
        "avg_charge_duration": 50.0,
        "charging_sessions": 2.0,
        "driving_style": "Normal",
        "avg_daily_distance": "30-50 km",
        "charging_frequency": "Daily",
        "fast_charging_usage": "Occasionally",
        "charging_habit": "Standard",
        "temperature_exposure": "Moderate"
    }
    response = client.post("/api/battery/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success" or "predicted_soh_3m" in data or "data" in data or "predictions" in data

# ==============================================================================
# COMPONENT 4: Charging Optimization Endpoints
# ==============================================================================

def test_charging_optimization_health():
    response = client.get("/api/ev-optimization/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_charging_dashboard():
    response = client.get("/api/ev-optimization/dashboard?userLat=6.9271&userLon=79.8612")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "estimatedRangeKm" in data["data"]

def test_range_prediction():
    payload = {
        "soc": 78.5,
        "batteryCapacityKWh": 64.0,
        "speedKmH": 80.0,
        "temperatureC": 28.0,
        "acOn": True
    }
    response = client.post("/api/ev-optimization/range/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["remainingRangeKm"] > 0

def test_queue_prediction():
    payload = {
        "stationId": "CS-CMB-001",
        "totalChargers": 8,
        "currentlyOccupied": 6,
        "arrivalHour": 17,
        "dayOfWeek": 3,
        "chargingSpeedKw": 50.0
    }
    response = client.post("/api/ev-optimization/queue/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "estimatedWaitMinutes" in data["data"]

def test_charging_stations():
    response = client.get("/api/ev-optimization/stations")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)

def test_charging_estimator():
    payload = {
        "batteryCapacityKWh": 64.0,
        "currentSoc": 20.0,
        "targetSoc": 80.0,
        "chargerPowerKw": 50.0,
        "efficiency": 0.92
    }
    response = client.post("/api/ev-optimization/charging/estimate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["chargingDurationMinutes"] > 0

def test_cost_estimate():
    payload = {
        "energyKWh": 35.0,
        "pricePerKWh": 0.35,
        "taxRate": 0.08,
        "serviceFee": 1.50
    }
    response = client.post("/api/ev-optimization/cost/estimate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["totalSessionCost"] > 0
