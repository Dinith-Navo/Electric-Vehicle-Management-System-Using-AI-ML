import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.modules.battery_health.schemas import NEW_FEATURES

client = TestClient(app)

def test_15_features_list():
    assert len(NEW_FEATURES) == 15
    assert "soh_estimated_pct" in NEW_FEATURES
    assert "battery_age_years" in NEW_FEATURES
    assert "odometer_km" in NEW_FEATURES
    assert "battery_nominal_capacity_kwh" in NEW_FEATURES
    assert "weekly_driving_distance_km" in NEW_FEATURES
    assert "weekly_charge_sessions" in NEW_FEATURES
    assert "weekly_fast_charge_fraction" in NEW_FEATURES
    assert "weekly_avg_soc_start_pct" in NEW_FEATURES
    assert "weekly_avg_soc_end_pct" in NEW_FEATURES
    assert "weekly_energy_consumption_kwh_per_100km" in NEW_FEATURES
    assert "weekly_avg_charge_duration_min" in NEW_FEATURES
    assert "battery_temperature_c" in NEW_FEATURES
    assert "battery_pack_voltage_v" in NEW_FEATURES
    assert "battery_nominal_voltage_v" in NEW_FEATURES
    assert "avg_charging_current_a" in NEW_FEATURES

def test_15_feature_full_prediction():
    payload = {
        "soh_estimated_pct": 91.5,
        "battery_age_years": 2.5,
        "odometer_km": 42000.0,
        "battery_nominal_capacity_kwh": 64.0,
        "weekly_driving_distance_km": 280.0,
        "weekly_charge_sessions": 3.0,
        "weekly_fast_charge_fraction": 0.25,
        "weekly_avg_soc_start_pct": 20.0,
        "weekly_avg_soc_end_pct": 80.0,
        "weekly_energy_consumption_kwh_per_100km": 16.8,
        "weekly_avg_charge_duration_min": 50.0,
        "battery_temperature_c": 29.0,
        "battery_pack_voltage_v": 395.0,
        "battery_nominal_voltage_v": 400.0,
        "avg_charging_current_a": 35.0,

        # Profile / Recommendations
        "vehicle_model": "Hyundai Kona Electric 64 kWh (NMC 622)",
        "driving_style": "Normal",
        "avg_daily_distance": "20-50 km",
        "charging_frequency": "3-5 times/week",
        "fast_charging_usage": "Sometimes",
        "charging_habit": "Mostly 20-80% (if recommended by manufacturer)",
        "temperature_exposure": "Moderate"
    }

    response = client.post("/api/battery/predict", json=payload)
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["status"] == "success"
    assert data["current_soh"] == 91.5
    assert data["soh_3m"] is not None
    assert data["soh_6m"] is not None
    assert data["soh_12m"] is not None
    assert data["degradation_3m"] is not None
    assert data["degradation_6m"] is not None
    assert data["degradation_12m"] is not None

    # SOH degradation must decrease future SOH monotonically
    assert data["current_soh"] >= data["soh_3m"]
    assert data["soh_3m"] >= data["soh_6m"]
    assert data["soh_6m"] >= data["soh_12m"]

    assert data["health_status"] == "Excellent"
    assert "risk_level" in data
    assert isinstance(data["recommendations"], list)
    assert len(data["recommendations"]) > 0

def test_individual_horizon_endpoints():
    payload = {
        "soh_estimated_pct": 88.0,
        "battery_age_years": 3.0,
        "odometer_km": 50000.0,
        "battery_nominal_capacity_kwh": 60.0,
        "weekly_driving_distance_km": 300.0,
        "weekly_charge_sessions": 4.0,
        "weekly_fast_charge_fraction": 0.20,
        "weekly_avg_soc_start_pct": 25.0,
        "weekly_avg_soc_end_pct": 85.0,
        "weekly_energy_consumption_kwh_per_100km": 17.0,
        "weekly_avg_charge_duration_min": 45.0,
        "battery_temperature_c": 30.0,
        "battery_pack_voltage_v": 390.0,
        "battery_nominal_voltage_v": 400.0,
        "avg_charging_current_a": 30.0,
    }

    res_3m = client.post("/api/battery/predict/3m", json=payload)
    assert res_3m.status_code == 200
    assert "predicted_soh_3m" in res_3m.json()

    res_6m = client.post("/api/battery/predict/6m", json=payload)
    assert res_6m.status_code == 200
    assert "predicted_soh_6m" in res_6m.json()

    res_12m = client.post("/api/battery/predict/12m", json=payload)
    assert res_12m.status_code == 200
    assert "predicted_soh_12m" in res_12m.json()

def test_validation_blocks_below_60_soh():
    payload = {
        "soh_estimated_pct": 55.0,
        "battery_age_years": 8.0,
        "odometer_km": 150000.0,
        "battery_nominal_capacity_kwh": 60.0,
        "weekly_driving_distance_km": 300.0,
        "weekly_charge_sessions": 4.0,
        "weekly_fast_charge_fraction": 0.20,
        "weekly_avg_soc_start_pct": 25.0,
        "weekly_avg_soc_end_pct": 85.0,
        "weekly_energy_consumption_kwh_per_100km": 17.0,
        "weekly_avg_charge_duration_min": 45.0,
        "battery_temperature_c": 30.0,
        "battery_pack_voltage_v": 390.0,
        "battery_nominal_voltage_v": 400.0,
        "avg_charging_current_a": 30.0,
    }
    res = client.post("/api/battery/predict", json=payload)
    # Validation error because SOH < 60
    assert res.status_code == 422


def test_exact_18_input_form_payload():
    """
    Tests prediction with exact 18 form inputs:
    15 numerical measurements + 3 contextual dropdowns (vehicle_model, driving_style, charging_habit).
    Zero repeated fields (no avg_daily_distance, charging_frequency, fast_charging_usage, temperature_exposure).
    """
    payload_18 = {
        # 15 numerical ML features
        "soh_estimated_pct": 92.0,
        "battery_age_years": 2.0,
        "odometer_km": 35000.0,
        "battery_nominal_capacity_kwh": 64.0,
        "weekly_driving_distance_km": 700.0,  # High distance -> triggers distance recommendation
        "weekly_charge_sessions": 15.0,  # High frequency -> triggers session recommendation
        "weekly_fast_charge_fraction": 0.45,  # High fast charge -> triggers fast charging recommendation
        "weekly_avg_soc_start_pct": 20.0,
        "weekly_avg_soc_end_pct": 80.0,
        "weekly_energy_consumption_kwh_per_100km": 17.5,
        "weekly_avg_charge_duration_min": 45.0,
        "battery_temperature_c": 39.5,  # High temperature -> triggers heat recommendation
        "battery_pack_voltage_v": 398.0,
        "battery_nominal_voltage_v": 400.0,
        "avg_charging_current_a": 32.0,

        # 3 contextual dropdowns only
        "vehicle_model": "Hyundai Kona Electric 64 kWh (NMC 622)",
        "driving_style": "Smooth",
        "charging_habit": "Mostly 20-80% (if recommended by manufacturer)"
    }

    # Verify no repeated fields exist in payload
    assert "avg_daily_distance" not in payload_18
    assert "charging_frequency" not in payload_18
    assert "fast_charging_usage" not in payload_18
    assert "temperature_exposure" not in payload_18

    response = client.post("/api/battery/predict", json=payload_18)
    assert response.status_code == 200, response.text
    data = response.json()

    assert data["status"] == "success"
    assert data["current_soh"] == 92.0
    assert data["soh_3m"] is not None
    assert data["soh_6m"] is not None
    assert data["soh_12m"] is not None
    assert data["degradation_3m"] is not None
    assert data["degradation_6m"] is not None
    assert data["degradation_12m"] is not None

    # Recommendations generated using numerical measurements
    titles = [rec["title"] for rec in data["recommendations"]]
    assert "Reduce frequent fast charging" in titles  # triggered by weekly_fast_charge_fraction >= 0.40
    assert "Reduce high battery temperature exposure" in titles  # triggered by battery_temperature_c >= 38.0
    assert "Plan charging for high usage" in titles  # triggered by weekly_driving_distance_km >= 600.0
    assert "High weekly charging frequency" in titles  # triggered by weekly_charge_sessions >= 14.0
    assert "Maintain smooth driving" in titles  # triggered by driving_style == 'Smooth'

