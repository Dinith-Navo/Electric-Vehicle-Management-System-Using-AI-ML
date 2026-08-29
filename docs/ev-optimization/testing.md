# 🧪 SmartEV: Automated Testing & Verification Guide
### Component 4: Intelligent EV Charging Optimization and Range Prediction System
**Student ID**: IT22134080  
**Branch**: `feature/ev-optimization`

---

## 📋 Overview of Test Suites

The test suite covers unit tests, API integration tests, and machine learning fallback tests across all 7 research capabilities.

| Test Suite | File Location | Scope |
| :--- | :--- | :--- |
| **Backend REST API** | `Backend/test_backend_api.py` | 12 Automated test cases covering health, dashboard, range prediction, queue prediction, station listings, recommendation ranking, route optimization, charging time estimator, and cost analytics. |
| **ML Microservice** | `ml-service/test_ml_service.py` | 3 Automated test cases covering range regression, temperature derating sensitivity, and station queue multi-output prediction. |

---

## 🚀 Running the Automated Tests

### 1. Backend API Test Suite

```powershell
cd Backend
python -m unittest test_backend_api.py
```

#### Expected Test Coverage:
1. `test_health_endpoint` – Verifies `/api/ev-optimization/health` returns `healthy` status and all submodules.
2. `test_dashboard_endpoint` – Tests dashboard data aggregation and vehicle telemetry metrics.
3. `test_range_predict_endpoint` – Tests dynamic range estimation with ambient temperature, speed, and SoC.
4. `test_queue_predict_endpoint` – Tests stall occupancy and queue delay prediction.
5. `test_stations_list_endpoint` – Tests multi-criteria charging station queries and filtering.
6. `test_station_by_id_endpoint` – Tests fetching specific station details by identifier.
7. `test_recommendation_endpoint` – Tests multi-factor scoring and driver recommendation output.
8. `test_route_optimize_endpoint` – Tests corridor feasibility analysis and charging stop recommendation.
9. `test_charging_time_estimate_endpoint` – Tests CC-CV taper curve charging duration calculation.
10. `test_charging_time_invalid_inputs` – Tests validation error handling (e.g. current SoC >= target SoC).
11. `test_cost_estimate_endpoint` – Tests single charging session cost calculation with tax and service fees.
12. `test_monthly_cost_summary_endpoint` – Tests monthly charging analytics and ICE fuel savings calculation.

---

### 2. ML Microservice Test Suite

```powershell
cd ml-service
python test_ml_service.py
```

#### Expected Test Coverage:
1. `test_range_prediction_fallback` – Validates range inference under baseline environmental conditions.
2. `test_range_prediction_extreme_temp` – Validates cold weather range derating ($T = -5^\circ\text{C}$ vs $T = 22^\circ\text{C}$).
3. `test_queue_prediction_fallback` – Validates queue length and wait-time predictions.

---

## 🔄 Resilient Fallback Testing

The system architecture is designed to remain completely operational even if supporting services are offline:
- **MongoDB Offline**: The backend switches automatically to pre-configured realistic in-memory station datasets.
- **ML Service Offline**: The backend seamlessly falls back to mathematical physics-based estimation formulas without crashing or returning 500 errors.
- **Trained Model Unloaded**: The ML service automatically falls back to heuristic domain estimators with `"source": "mock"`.
