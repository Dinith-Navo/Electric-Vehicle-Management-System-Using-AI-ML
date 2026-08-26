# 🚗 SmartEV - Intelligent Electric Vehicle Management System

### Smart, Intelligent, and AI-Powered EV Management System!

Welcome to **SmartEV**, an intelligent Electric Vehicle Management System designed to enhance the modern EV experience using Artificial Intelligence (AI) and Machine Learning (ML). Our system focuses on smart battery monitoring, predictive maintenance, intelligent diagnostics, and optimized charging assistance for electric vehicles.

SmartEV helps EV users and service providers make better decisions through real-time insights, predictive analytics, and AI-powered recommendations.

---

## ✨ Features

- 🔋 **Battery Health Prediction** – Predict battery State of Health (SoH) and degradation trends
- ⚠️ **Failure Prediction System** – Detect possible EV failures before breakdowns occur
- 🧠 **Intelligent EV Diagnosis** – AI-powered problem diagnosis with smart recommendations
- ⚡ **Intelligent EV Charging Optimization & Range Prediction** – Smart range estimation, queue prediction, multi-factor station ranking, route energy optimizer, and session cost calculator
- 📈 **Performance Monitoring Dashboard** – Real-time EV performance tracking and analytics
- 📍 **Predictive Breakdown Assistance** – Early breakdown risk alerts and recommendations
- 🔐 **Secure Authentication System** – Fast, secure JWT user management
- 📩 **Push Notifications** – Real-time alerts for battery health and maintenance updates

---

## 🧠 Research Components

### 1️⃣ Post-Sale EV Performance Intelligence & Failure Prediction
* Vehicle performance monitoring & efficiency analysis
* Failure prediction alerts & predictive maintenance notifications
* **ML Models**: Random Forest, Gradient Boosting Machine (GBM), Support Vector Regression (SVR)

### 2️⃣ Adaptive Battery Health Prediction (Charging & Driving Behavior)
* Battery SoH prediction & charging behavior analysis
* Driving pattern analysis & degradation forecasting
* **ML Models**: LSTM, Random Forest Regressor, XGBoost

### 3️⃣ Intelligent EV Problem Diagnosis with Context-Aware Guidance
* Smart EV issue diagnosis & error detection system
* AI troubleshooting guidance & severity prediction
* **ML Models**: Decision Tree Classifier, NLP-Based Symptom Analysis

### 4️⃣ Intelligent EV Charging Optimization and Range Prediction System
* **Smart Range Prediction**: Dynamic remaining range estimation considering speed, ambient temperature, battery SoC, and AC usage
* **Station Queue & Wait Time Prediction**: Live stall occupancy analysis, wait time forecasting, and 6-hour queue forecast
* **Smart Station Filtering & Multi-Factor Scoring**: Distance, charging power, pricing, rating, and availability ranking
* **Route Energy Optimization**: Battery feasibility analysis and corridor charging stop recommendations
* **Charging Time Estimator**: Fast-charging taper curve duration calculations
* **Cost & Energy Analytics**: Session cost calculator and monthly charging spend dashboard
* **ML Models**: Regression Models (Scikit-Learn / XGBoost), Queuing Theory Models, Time-Series Forecasting

---

## 👨‍💻 Project Members

| Name | Student ID | Email | Component |
| :--- | :--- | :--- | :--- |
| Vidushan A A D D N | IT22157928 | it22157928@my.sliit.lk | 1. Post-Sale Performance & Failure Prediction |
| Fernando C T H H D | IT22247490 | it22247490@my.sliit.lk | 2. Adaptive Battery Health Prediction |
| Dias N T B P | IT22134080 | it22134080@my.sliit.lk | 3. Intelligent EV Problem Diagnosis |
| Jayarathne W.T.D.K. | IT22071170 | it22071170@my.sliit.lk | 4. Intelligent EV Charging & Range Optimization |

---

## 📁 Project Structure

```
Electric-Vehicle-Management-System-Using-AI-ML/
│
├── Backend/                                    # Python FastAPI Backend Server (:8000)
│   ├── ev_optimization/                       # Research Component 4: EV Optimization
│   │   ├── range_prediction/                  # Range estimation & ML connector
│   │   ├── queue_prediction/                  # Queue & wait time predictor
│   │   ├── charging_stations/                 # Station queries & filtering
│   │   ├── route_optimization/                # Route planning & charging stop finder
│   │   ├── charging_estimator/                # Charging duration & power calculator
│   │   ├── cost_analysis/                     # Cost calculator & monthly analytics
│   │   ├── recommendation/                    # Multi-factor station ranking
│   │   ├── ml_integration/                    # ML client & resilient fallback
│   │   └── ev_optimization_routes.py          # API router mounted at /api/ev-optimization
│   ├── database.py                            # MongoDB Async Motor client
│   ├── main.py                                # FastAPI app entrypoint & CORS
│   ├── seed_ev_data.py                        # Database seed script
│   ├── test_backend_api.py                    # Automated test suite
│   └── requirements.txt
│
├── Frontend/
│   └── ElectricVehicle/                       # React Native Mobile App (Expo Router)
│       ├── app/
│       │   ├── ev_optimization/               # Component 4 Navigation Screens
│       │   │   ├── dashboard.tsx              # Overview & vehicle telemetry
│       │   │   ├── range_prediction.tsx       # Range predictor form & results
│       │   │   ├── charging_stations.tsx      # Station browser & filter modal
│       │   │   ├── queue_prediction.tsx       # Queue & wait time forecast
│       │   │   ├── route_optimization.tsx     # Route feasibility & charging stops
│       │   │   ├── charging_estimator.tsx     # Time & power calculator
│       │   │   └── cost_analysis.tsx          # Cost breakdown & monthly report
│       │   ├── battery_health/                # Component 2 Screens
│       │   └── mainpage/                      # Home dashboard & feature cards
│       └── ev_optimization/                   # Modular feature services & API client
│
├── ml-service/                                # Python ML Inference Microservice (:8001)
│   ├── app/
│   │   ├── api/                               # POST /predict/range, POST /predict/queue
│   │   ├── models/                            # Google Colab model loader interface
│   │   ├── services/                          # Prediction execution & fallback
│   │   ├── schemas/                           # Pydantic schemas
│   │   └── main.py                            # FastAPI app entrypoint
│   ├── saved_models/                          # Drop-in folder for trained models
│   │   ├── range/                             # .joblib / .pkl Range model
│   │   └── queue/                             # .joblib / .pkl Queue model
│   ├── datasets/                              # Raw, processed, and external datasets
│   ├── training/                              # Training documentation & Colab templates
│   ├── notebooks/                             # Research notebooks
│   ├── test_ml_service.py                     # ML test suite
│   └── requirements.txt
│
└── docs/
    └── ev-optimization/                       # Comprehensive Research Documentation
        ├── architecture.md                    # System architecture & scoring formulas
        ├── api.md                             # REST API reference
        ├── ml-integration.md                  # Google Colab export & drop-in guide
        └── database.md                        # Database schemas & collection models
```

---

## 🚀 Step-by-Step Execution Guide

### 1️⃣ Terminal 1: ML Prediction Microservice (Port 8001)

```powershell
cd ml-service
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8001 --reload
```
*Health Check: `http://localhost:8001/health`*

---

### 2️⃣ Terminal 2: Backend REST API (Port 8000)

```powershell
cd Backend
pip install -r requirements.txt

# (Optional) Seed MongoDB database with realistic test data:
python seed_ev_data.py

# Start Backend Server:
python -m uvicorn main:app --port 8000 --reload
```
*Interactive Swagger Documentation: `http://localhost:8000/docs`*

---

### 3️⃣ Terminal 3: Frontend Application (Expo)

```powershell
cd Frontend\ElectricVehicle
npm install
npx expo start
```

* **Press `w`** to open the Web preview in your browser.
* **Press `a`** to open on Android Emulator.
* **Scan QR Code** with the **Expo Go** app on your physical mobile device.

---

## 🧪 Automated Testing

To run the automated test suites:

```powershell
# Test Backend APIs (all 12 endpoints & fallback handlers):
cd Backend
python test_backend_api.py

# Test ML Prediction Microservice:
cd ml-service
python test_ml_service.py
```

---

## 🤖 Google Colab Model Drop-in Guide

Real machine learning models are trained separately in Google Colab. To connect trained models to the system:

1. Train and export your model from Google Colab using `joblib`:
   ```python
   import joblib
   joblib.dump(model, "ev_range_model.joblib")
   ```
2. Drop the exported file into:
   - **Range Model**: `ml-service/saved_models/range/`
   - **Queue Model**: `ml-service/saved_models/queue/`
3. Restart the ML microservice. The `RangeModelLoader` and `QueueModelLoader` will automatically detect and load the models. The API will switch from `"source": "mock"` to `"source": "trained-model"` with **zero code modifications**.

---

## 🤝 License
This project is developed for university research and academic purposes.
