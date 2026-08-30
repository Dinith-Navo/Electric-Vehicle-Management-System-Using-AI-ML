from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "running"


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"
    assert data["api"] == "running"


def test_model_status():
    response = client.get(
        "/api/battery/status"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["service"] == (
        "battery-prediction"
    )

    # Model is currently not trained
    assert data["models_available"] is False


def test_auth_requires_token():
    response = client.get(
        "/api/auth/me"
    )

    assert response.status_code == 401


def test_invalid_soh_validation():

    payload = {
        "current_soh": 150,
        "battery_age_months": 36,
        "avg_voltage": 350,
        "avg_current": -70,
        "avg_temperature": 34,
        "avg_soc_change": 45,
        "avg_charge_duration": 55,
        "charging_sessions": 16,
        "driving_style": "Normal",
        "avg_daily_distance": "20-50 km",
        "charging_frequency": "2-5 Times",
        "fast_charging_usage": "Sometimes",
        "charging_habit": "Optimal (20-80%)",
        "temperature_exposure": "Moderate",
        "user_id": "demo-user"
    }

    response = client.post(
        "/api/battery/predict",
        json=payload
    )

    assert response.status_code == 422


def test_prediction_model_pending():

    payload = {
        "current_soh": 92,
        "battery_age_months": 36,
        "avg_voltage": 350,
        "avg_current": -70,
        "avg_temperature": 34,
        "avg_soc_change": 45,
        "avg_charge_duration": 55,
        "charging_sessions": 16,
        "driving_style": "Normal",
        "avg_daily_distance": "20-50 km",
        "charging_frequency": "2-5 Times",
        "fast_charging_usage": "Sometimes",
        "charging_habit": "Optimal (20-80%)",
        "temperature_exposure": "Moderate",
        "user_id": "demo-user"
    }

    response = client.post(
        "/api/battery/predict",
        json=payload
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "model_pending"

    assert data["soh_3m"] is None
    assert data["soh_6m"] is None
    assert data["soh_12m"] is None

    assert len(
        data["recommendations"]
    ) >= 1