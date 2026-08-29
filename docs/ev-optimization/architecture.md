# Architecture Design: Intelligent EV Charging Optimization and Range Prediction System

## 1. System Overview

The **Intelligent EV Charging Optimization and Range Prediction System** is a university research component designed to enhance the electric vehicle ownership and transit experience through predictive analytics, intelligent recommendation scoring, and route energy feasibility analysis.

```
+-------------------------------------------------------------------------+
|                  React Native (Expo) Frontend Client                    |
|  - EV Optimization Dashboard (/ev_optimization/dashboard)              |
|  - Smart Range Predictor (/ev_optimization/range_prediction)            |
|  - Charging Station Directory & Filter (/ev_optimization/charging_stations) |
|  - Queue & Wait Predictor (/ev_optimization/queue_prediction)           |
|  - Smart Route Optimizer (/ev_optimization/route_optimization)          |
|  - Charging Time Estimator (/ev_optimization/charging_estimator)        |
|  - Cost & Energy Analytics (/ev_optimization/cost_analysis)             |
+------------------------------------+------------------------------------+
                                     |  HTTP / REST JSON (:8000)
                                     v
+-------------------------------------------------------------------------+
|                      FastAPI Backend Server (:8000)                     |
|  - Master Router: /api/ev-optimization/*                                |
|  - Range Prediction Service & Fallback                                  |
|  - Queue Prediction Service & Fallback                                  |
|  - Multi-Factor Recommendation Scoring Engine                           |
|  - Route Feasibility & Corridor Stop Optimizer                          |
|  - Charging Curve & Taper Duration Calculator                           |
|  - Cost Aggregator & Session History Analytics                          |
+-------------------+--------------------------------+--------------------+
                    | Async Motor Driver             | HTTP Calls (:8001)
                    v                                v
+-----------------------+        +----------------------------------------+
|   MongoDB Database    |        |       FastAPI ML Microservice (:8001)  |
|  - vehicles           |        |  - POST /predict/range                 |
|  - charging_stations  |        |  - POST /predict/queue                 |
|  - charging_sessions  |        |  - RangeModelLoader (saved_models/)    |
|  - prediction_logs    |        |  - QueueModelLoader (saved_models/)    |
|  - telemetry          |        |  - Empirical Physics & Queuing Fallback|
+-----------------------+        +----------------------------------------+
```

---

## 2. Component Layers

### 2.1 Frontend Client (React Native + Expo Router)
- **Modular Isolation**: All feature components and screens are grouped under `ev_optimization/` and `app/ev_optimization/`.
- **Theme Awareness**: Dynamic light/dark theme switching via `ThemeContext.tsx`.
- **Resilient API Client**: Centralized Axios client (`ev_optimization/services/apiClient.ts`) providing automatic network IP resolution and graceful offline fallbacks.

### 2.2 Backend Architecture (FastAPI + Async Motor)
- **Controller-Service-Model Pattern**: Clean separation of HTTP routing, validation schemas, business logic calculations, and data persistence.
- **Fail-Safe Offline Tolerance**: If the ML microservice or MongoDB is offline or unreachable, internal deterministic mathematical models execute automatically without throwing 500 errors.

### 2.3 Standalone ML Microservice (FastAPI :8001)
- **Clean Model Loader Interface**: Dynamically scans `saved_models/range/` and `saved_models/queue/` for serialized `.joblib`, `.pkl`, or `.pickle` model artifacts.
- **Fallback Regressors**: Includes physics-based temperature/speed/AC energy degradation equations and $M/M/c$ queuing theory approximations when trained models are not yet supplied.
- **Google Colab Drop-in Ready**: Models trained in Google Colab can be exported and placed directly into `saved_models/` without code changes.

---

## 3. Recommendation Scoring Engine Formulation

The multi-factor station recommendation engine calculates a normalized suitability score ($0 - 100$) for each candidate station:

$$\text{SuitabilityScore} = 100 \times \left( w_d S_{\text{dist}} + w_a S_{\text{avail}} + w_s S_{\text{speed}} + w_c S_{\text{cost}} + w_r S_{\text{rating}} + w_q S_{\text{queue}} \right)$$

Where the default scoring weights are:
- $w_d = 0.25$ (Distance / Proximity factor via Haversine distance)
- $w_a = 0.20$ (Live stall availability ratio)
- $w_s = 0.20$ (Charging power output score up to 150kW)
- $w_c = 0.15$ (Cost affordability factor per kWh)
- $w_r = 0.10$ (User feedback rating out of 5 stars)
- $w_q = 0.10$ (Estimated waiting time penalty)
