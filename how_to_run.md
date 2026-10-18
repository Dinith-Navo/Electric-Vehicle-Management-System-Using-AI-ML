# SmartEV — How to Run the Project

## Architecture Overview

```
Smart_EV/
├── backend/       → FastAPI (Python) — Unified AI/ML API     → Port 8000
├── ml-service/    → FastAPI (Python) — ML Inference Service   → Port 8001
└── frontend/      → React Native (Expo)                       → Port 8081
```

> [!IMPORTANT]
> You need **3 terminals** running simultaneously: Backend, ML Service, and Frontend.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10+ |
| Node.js | 18+ |
| npm | 9+ |
| MongoDB | Running locally on port 27017 (or a MongoDB Atlas URI) |
| Expo Go App | Installed on your phone (optional, for mobile testing) |

---

## 1. 🗄️ Backend (FastAPI — Port 8000)

### Step 1 — Set up environment

```powershell
cd "c:\Users\Thiyangi\OneDrive - Sri Lanka Institute of Information Technology\SLIIT\Y4S2\Research\Final viva\Smart_EV\Smart_EV\backend"

# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\Activate.ps1
```

### Step 2 — Install dependencies

```powershell
pip install -r requirements.txt
```

### Step 3 — Configure environment

Create a `.env` file inside the `backend/` directory:

```env
MONGO_URI=mongodb://localhost:27017
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

> [!NOTE]
> The backend also expects Firebase credentials at `backend/secrets/serviceAccountKey.json`.
> If you don't have Firebase, the battery health component will warn but the rest of the API will still start.

### Step 4 — Run the backend

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Verify:** Open http://localhost:8000/docs in your browser — you should see the Swagger UI.

---

## 2. 🤖 ML Service (FastAPI — Port 8001)

### Step 1 — Set up environment (new terminal)

```powershell
cd "c:\Users\Thiyangi\OneDrive - Sri Lanka Institute of Information Technology\SLIIT\Y4S2\Research\Final viva\Smart_EV\Smart_EV\ml-service"

python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 2 — Install dependencies

```powershell
pip install -r requirements.txt
```

### Step 3 — Configure environment

Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

The defaults in `.env.example` are sufficient for local development:
```env
ML_SERVICE_PORT=8001
HOST=0.0.0.0
SAVED_MODELS_DIR=saved_models
LOG_LEVEL=INFO
```

### Step 4 — Run the ML service

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Verify:** Open http://localhost:8001/docs in your browser.

---

## 3. 📱 Frontend (React Native / Expo — Port 8081)

### Step 1 — Install dependencies (new terminal)

```powershell
cd "c:\Users\Thiyangi\OneDrive - Sri Lanka Institute of Information Technology\SLIIT\Y4S2\Research\Final viva\Smart_EV\Smart_EV\frontend"

npm install
```

### Step 2 — Run the Expo dev server

```powershell
npx expo start
```

This will print a QR code in the terminal.

### Step 3 — View the app

| Platform | How |
|----------|-----|
| **Web browser** | Press `w` in the terminal |
| **Android phone** | Scan the QR code with the **Expo Go** app |
| **iOS phone** | Scan the QR code with the **Camera** app → tap the Expo Go link |
| **Android emulator** | Press `a` (requires Android Studio + emulator running) |

> [!TIP]
> For web testing, press `w` right after `npx expo start`. This is the easiest way to test without a phone.

---

## Quick Start Summary

Open **3 separate PowerShell terminals** and run one command in each:

```powershell
# Terminal 1 — Backend
cd "...\Smart_EV\backend" ; .\venv\Scripts\Activate.ps1 ; uvicorn app.main:app --port 8000 --reload

# Terminal 2 — ML Service
cd "...\Smart_EV\ml-service" ; .\venv\Scripts\Activate.ps1 ; uvicorn app.main:app --port 8001 --reload

# Terminal 3 — Frontend
cd "...\Smart_EV\frontend" ; npx expo start
```

---

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:8000 | Main API |
| Backend Docs | http://localhost:8000/docs | Swagger UI |
| Backend Health | http://localhost:8000/health | Health check |
| ML Service | http://localhost:8001 | ML Inference API |
| ML Docs | http://localhost:8001/docs | Swagger UI |
| ML Health | http://localhost:8001/health | Health check |
| Frontend (Web) | http://localhost:8081 | Expo Web |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError` | Make sure venv is activated and `pip install -r requirements.txt` was run |
| MongoDB connection error | Start MongoDB: `mongod` or install [MongoDB Community](https://www.mongodb.com/try/download/community) |
| Firebase warning on startup | Place `serviceAccountKey.json` in `backend/secrets/` or ignore if not using battery health |
| Expo QR code not working | Ensure phone and PC are on the **same Wi-Fi network** |
| Port already in use | Change `--port` flag or kill the process using `netstat -ano | findstr :8000` |
