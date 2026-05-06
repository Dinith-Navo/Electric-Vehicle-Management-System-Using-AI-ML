# PSEVPIFPS — Post Sale EV Performance Intelligence & Failure Prediction System

## Project Structure

```
Electric-Vehicle-Management-System-Using-AI-ML/
├── Frontend/          ← React Native Expo App
├── Backend/           ← Node.js Express API
└── ML-Service/        ← Python FastAPI + Random Forest
```

---

## 🚀 Quick Start

### 1. ML Service (Python FastAPI)
```bash
cd ML-Service
pip install -r requirements.txt

# Train the Random Forest model (already done, model saved)
python models/train_rf.py

# Start ML service on port 8000
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Backend (Node.js)
```bash
cd Backend
npm install

# Edit .env with your MongoDB URI and JWT secret
# Start dev server on port 5000
npx ts-node src/server.ts
```

Or with nodemon:
```bash
npx nodemon --exec "npx ts-node" src/server.ts
```

### 3. Frontend (Expo)
```bash
cd Frontend
npm install

# Update services/api.ts with your machine's LAN IP
# Demo mode works without backend — use demo@ev.com / demo1234

npx expo start
```

---

## 📱 App Tabs

| Tab | File | Features |
|-----|------|---------|
| 🏠 Home | `dashboard.tsx` | Live telemetry, battery gauge, AI summary, metrics |
| 🤖 AI | `ai-insights.tsx` | RF prediction, risk meter, recommendations, history |
| 🚗 Vehicles | `vehicles.tsx` | Full CRUD with modal form, color picker |
| 📊 Analytics | `analytics.tsx` | 4-tab charts: battery/charging/temp/energy |
| 🔔 Alerts | `notifications.tsx` | Real-time alerts, unread badges, pull-to-refresh |
| 👤 Profile | `profile.tsx` | Edit profile, dark mode, settings, logout |

---

## 🔑 Demo Login

- Email: `demo@ev.com`
- Password: `demo1234`

Works offline — no backend required for demo mode.

---

## 🤖 ML Model

- **Algorithm**: Random Forest Regressor (100 trees)
- **Task**: Battery State-of-Health (SoH) Prediction
- **MAE**: 1.694% | **R²**: 0.9592
- **Features**: Voltage, Current, Temperature, Charging Cycles, Charging Frequency
- **Output**: Predicted SoH%, Risk Level, Confidence, Recommendations

---

## 🛠 Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/vehicles` | Get all vehicles |
| POST | `/api/vehicles` | Add vehicle |
| PUT | `/api/vehicles/:id` | Update vehicle |
| DELETE | `/api/vehicles/:id` | Delete vehicle |
| GET | `/api/telemetry` | Latest telemetry |
| GET | `/api/telemetry/history` | Historical data |
| POST | `/api/telemetry` | Post telemetry |
| POST | `/api/predictions/predict-soh` | Run SoH prediction |
| GET | `/api/predictions` | Prediction history |
| GET | `/api/notifications` | Get notifications |
| PATCH | `/api/notifications/:id/read` | Mark read |
| GET | `/api/users/me` | Get profile |
| PUT | `/api/users/me` | Update profile |