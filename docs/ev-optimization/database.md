# Database Documentation & Collection Schema

## 1. Overview

SmartEV uses MongoDB (`ev_management` database) via the async `motor.motor_asyncio` driver.

Connection String: `mongodb://localhost:27017` (configurable via `MONGO_URI` environment variable).

---

## 2. Collections Schema

### 2.1 `charging_stations`
Stores metadata, physical location coordinates, port capabilities, and live stall status.
```json
{
  "_id": ObjectId("..."),
  "stationId": "CS-CMB-001",
  "name": "Colombo Fort Supercharge Hub",
  "operator": "ChargeNet LK",
  "location": {
    "address": "Lotus Road, Colombo 01",
    "city": "Colombo",
    "latitude": 6.9344,
    "longitude": 79.8428
  },
  "ports": [
    { "type": "CCS2", "powerKw": 150.0, "total": 4, "available": 3, "pricePerKWh": 0.38 },
    { "type": "CHAdeMO", "powerKw": 50.0, "total": 2, "available": 1, "pricePerKWh": 0.32 },
    { "type": "Type 2", "powerKw": 22.0, "total": 2, "available": 2, "pricePerKWh": 0.25 }
  ],
  "rating": 4.8,
  "totalReviews": 56,
  "isOperational": true,
  "amenities": ["Restroom", "Coffee Shop", "Free WiFi", "24/7 Security"]
}
```

### 2.2 `charging_sessions`
Historical records of completed charging sessions for cost and energy consumption analytics.
```json
{
  "_id": ObjectId("..."),
  "sessionId": "SES-0982",
  "date": "2026-08-24",
  "stationName": "Colombo Fort Supercharge Hub",
  "energyKWh": 28.5,
  "durationMinutes": 24,
  "cost": 10.83,
  "chargerType": "CCS2 (150kW)"
}
```

### 2.3 `vehicles`
Stores registered EV specifications, battery size, VIN, and manufacturer details.
```json
{
  "_id": ObjectId("..."),
  "model": "Hyundai Kona Electric",
  "manufacturer": "Hyundai",
  "batteryType": "Lithium-Ion Polymer",
  "batteryCapacityKWh": 64.0,
  "year": 2024,
  "vin": "KMHEV81ABLA109823",
  "drivingEfficiency": 14.8
}
```

### 2.4 `prediction_logs`
Audit log of ML/fallback inference requests and calculated outputs for research performance monitoring.

---

## 3. Database Seeding

To populate MongoDB with realistic Sri Lankan and international stations, vehicles, and session records, run:

```powershell
python Backend/seed_ev_data.py
```
