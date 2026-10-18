import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.main import app
from app.modules.battery_health.schemas import BatteryPredictionRequest, NEW_FEATURES
from app.modules.battery_health.services.recommendation_service import generate_recommendations

client = TestClient(app)

BASE_VALID_PAYLOAD = {
    "soh_estimated_pct": 92.0,
    "battery_age_years": 2.5,
    "odometer_km": 35000.0,
    "battery_nominal_capacity_kwh": 64.0,
    "weekly_driving_distance_km": 250.0,
    "weekly_charge_sessions": 4.0,
    "weekly_fast_charge_fraction": 0.5,
    "weekly_avg_soc_start_pct": 20.0,
    "weekly_avg_soc_end_pct": 80.0,
    "weekly_energy_consumption_kwh_per_100km": 16.5,
    "weekly_avg_charge_duration_min": 45.0,
    "battery_temperature_c": 25.0,
    "battery_pack_voltage_v": 395.0,
    "battery_nominal_voltage_v": 400.0,
    "avg_charging_current_a": 32.0,
    "vehicle_model": "Hyundai Kona Electric 64 kWh (NMC 622)",
    "driving_mode": "Normal",
    "charging_habit": "Mostly 20-80% (if recommended by manufacturer)"
}

def test_15_features_preserved_and_exact_order():
    """Verify exact 15 ML features remain unchanged in identity and sequence."""
    expected_features = [
        "soh_estimated_pct",
        "battery_age_years",
        "odometer_km",
        "battery_nominal_capacity_kwh",
        "weekly_driving_distance_km",
        "weekly_charge_sessions",
        "weekly_fast_charge_fraction",
        "weekly_avg_soc_start_pct",
        "weekly_avg_soc_end_pct",
        "weekly_energy_consumption_kwh_per_100km",
        "weekly_avg_charge_duration_min",
        "battery_temperature_c",
        "battery_pack_voltage_v",
        "battery_nominal_voltage_v",
        "avg_charging_current_a"
    ]
    assert NEW_FEATURES == expected_features
    assert "battery_pack_voltage_v" in NEW_FEATURES
    assert "battery_nominal_voltage_v" in NEW_FEATURES

def test_battery_age_validation():
    # Valid: 0, 10, decimal 2.5
    req_0 = BatteryPredictionRequest(**{**BASE_VALID_PAYLOAD, "battery_age_years": 0.0})
    assert req_0.battery_age_years == 0.0

    req_10 = BatteryPredictionRequest(**{**BASE_VALID_PAYLOAD, "battery_age_years": 10.0})
    assert req_10.battery_age_years == 10.0

    # Invalid: -1, 11
    with pytest.raises(ValidationError):
        BatteryPredictionRequest(**{**BASE_VALID_PAYLOAD, "battery_age_years": -1.0})

    with pytest.raises(ValidationError):
        BatteryPredictionRequest(**{**BASE_VALID_PAYLOAD, "battery_age_years": 11.0})

def test_battery_temperature_validation():
    # Valid: -20, 25, 40, 60
    req_neg20 = BatteryPredictionRequest(**{**BASE_VALID_PAYLOAD, "battery_temperature_c": -20.0})
    assert req_neg20.battery_temperature_c == -20.0

    req_25 = BatteryPredictionRequest(**{**BASE_VALID_PAYLOAD, "battery_temperature_c": 25.0})
    assert req_25.battery_temperature_c == 25.0

    req_40 = BatteryPredictionRequest(**{**BASE_VALID_PAYLOAD, "battery_temperature_c": 40.0})
    assert req_40.battery_temperature_c == 40.0

    req_60 = BatteryPredictionRequest(**{**BASE_VALID_PAYLOAD, "battery_temperature_c": 60.0})
    assert req_60.battery_temperature_c == 60.0

    # Invalid: -21, 61
    with pytest.raises(ValidationError):
        BatteryPredictionRequest(**{**BASE_VALID_PAYLOAD, "battery_temperature_c": -21.0})

    with pytest.raises(ValidationError):
        BatteryPredictionRequest(**{**BASE_VALID_PAYLOAD, "battery_temperature_c": 61.0})

def test_voltage_and_capacity_ranges():
    # Nominal voltage 400V, pack voltage 395V
    req_400 = BatteryPredictionRequest(**{
        **BASE_VALID_PAYLOAD,
        "battery_nominal_voltage_v": 400.0,
        "battery_pack_voltage_v": 395.0
    })
    assert req_400.battery_nominal_voltage_v == 400.0
    assert req_400.battery_pack_voltage_v == 395.0

    # Nominal voltage 697V (e.g. 800V class architecture / Lucid/Porsche)
    req_697 = BatteryPredictionRequest(**{
        **BASE_VALID_PAYLOAD,
        "battery_nominal_voltage_v": 697.0,
        "battery_pack_voltage_v": 710.0
    })
    assert req_697.battery_nominal_voltage_v == 697.0
    assert req_697.battery_pack_voltage_v == 710.0

    # Battery capacity 84 kWh and 123 kWh
    req_84 = BatteryPredictionRequest(**{**BASE_VALID_PAYLOAD, "battery_nominal_capacity_kwh": 84.0})
    assert req_84.battery_nominal_capacity_kwh == 84.0

    req_123 = BatteryPredictionRequest(**{**BASE_VALID_PAYLOAD, "battery_nominal_capacity_kwh": 123.0})
    assert req_123.battery_nominal_capacity_kwh == 123.0

def test_dc_fast_charging_cross_field_validation():
    # 4 weekly sessions, 2 DC sessions -> valid, fraction 0.5
    req_valid = BatteryPredictionRequest(**{
        **BASE_VALID_PAYLOAD,
        "weekly_charge_sessions": 4.0,
        "dc_fast_charging_sessions": 2.0
    })
    assert req_valid.weekly_fast_charge_fraction == 0.5

    # 4 weekly sessions, 5 DC sessions -> invalid
    with pytest.raises(ValidationError):
        BatteryPredictionRequest(**{
            **BASE_VALID_PAYLOAD,
            "weekly_charge_sessions": 4.0,
            "dc_fast_charging_sessions": 5.0
        })

def test_soc_cross_field_validation():
    # End SOC > Start SOC (80% > 20%) -> valid
    req_valid = BatteryPredictionRequest(**{
        **BASE_VALID_PAYLOAD,
        "weekly_charge_sessions": 4.0,
        "weekly_avg_soc_start_pct": 20.0,
        "weekly_avg_soc_end_pct": 80.0
    })
    assert req_valid.weekly_avg_soc_end_pct > req_valid.weekly_avg_soc_start_pct

    # End SOC <= Start SOC with charging sessions recorded -> invalid
    with pytest.raises(ValidationError):
        BatteryPredictionRequest(**{
            **BASE_VALID_PAYLOAD,
            "weekly_charge_sessions": 4.0,
            "weekly_avg_soc_start_pct": 80.0,
            "weekly_avg_soc_end_pct": 20.0
        })

def test_driving_mode_recommendations():
    # Test Eco
    recs_eco = generate_recommendations(
        data={"driving_mode": "Eco", "weekly_energy_consumption_kwh_per_100km": 15.0},
        predictions={"current_soh": 90.0, "soh_3m": 89.5, "soh_6m": 89.0, "soh_12m": 88.0}
    )
    titles_eco = [r["title"] for r in recs_eco]
    assert any("smooth" in t.lower() or "eco" in t.lower() for t in titles_eco)

    # Test Sport
    recs_sport = generate_recommendations(
        data={"driving_mode": "Sport", "weekly_energy_consumption_kwh_per_100km": 24.0},
        predictions={"current_soh": 90.0, "soh_3m": 89.5, "soh_6m": 89.0, "soh_12m": 88.0}
    )
    titles_sport = [r["title"] for r in recs_sport]
    assert any("acceleration" in t.lower() or "consumption" in t.lower() for t in titles_sport)

def test_full_battery_predict_api():
    payload = {
        **BASE_VALID_PAYLOAD,
        "battery_age_years": 3.0,
        "battery_temperature_c": 32.0,
        "driving_mode": "Eco"
    }
    resp = client.post("/api/battery/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["soh_3m"] is not None
    assert data["soh_6m"] is not None
    assert data["soh_12m"] is not None
    assert data["degradation_3m"] is not None
    assert data["degradation_6m"] is not None
    assert data["degradation_12m"] is not None
    assert len(data["recommendations"]) > 0
