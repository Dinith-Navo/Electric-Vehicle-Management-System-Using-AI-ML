# API Reference: EV Optimization & Prediction Endpoints

Base URL: `http://localhost:8000/api/ev-optimization`
Interactive Swagger Documentation: `http://localhost:8000/docs`

---

## 1. System Health Check
- **Endpoint**: `GET /health`
- **Description**: Verifies the status of the EV Optimization module and list of active submodules.
- **Response**:
```json
{
  "status": "healthy",
  "module": "Intelligent EV Charging Optimization & Range Prediction",
  "version": "1.0.0",
  "submodules": [
    "range_prediction",
    "queue_prediction",
    "charging_stations",
    "recommendation",
    "route_optimization",
    "charging_estimator",
    "cost_analysis",
    "ml_integration"
  ]
}
```

---

## 2. Dashboard Overview
- **Endpoint**: `GET /dashboard`
- **Query Params**: `userLat` (float), `userLon` (float)
- **Response**:
```json
{
  "success": true,
  "data": {
    "vehicle": {
      "model": "Hyundai Kona Electric",
      "batteryCapacityKWh": 64.0,
      "currentSoc": 74.0,
      "vin": "KMHEV81ABLA109823"
    },
    "currentSoc": 74.0,
    "estimatedRangeKm": 342.5,
    "rangeConfidence": 0.91,
    "rangeSource": "mock",
    "nearbyStationsCount": 6,
    "recommendedStation": { ... },
    "monthlyCostToDate": 43.42,
    "quickStats": { ... }
  },
  "message": "Dashboard overview loaded successfully."
}
```

---

## 3. Range Prediction
- **Endpoint**: `POST /range/predict`
- **Request Body**:
```json
{
  "soc": 75.0,
  "batteryCapacityKWh": 64.0,
  "speedKmH": 60.0,
  "temperatureC": 28.0,
  "energyConsumptionKWhPer100Km": 14.8,
  "acOn": true,
  "drivingMode": "Normal",
  "vehicleModel": "Hyundai Kona Electric"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "remainingRangeKm": 324.5,
    "confidenceScore": 0.88,
    "source": "mock",
    "modelName": "EmpiricalPhysicsRegressor-Fallback",
    "factors": {
      "usableEnergyKWh": 48.0,
      "effectiveConsumptionKWhPer100Km": 14.8,
      "tempFactor": 1.0,
      "speedFactor": 1.0,
      "acFactor": 1.1
    },
    "timestamp": "2026-08-26T16:30:00Z"
  },
  "message": "EV driving range calculated successfully."
}
```

---

## 4. Charging Stations
- **Endpoint**: `GET /stations`
- **Query Params**: `maxDistanceKm`, `minPowerKw`, `maxPricePerKWh`, `connectorType`, `minRating`, `onlyAvailable`, `sortBy`, `userLat`, `userLon`
- **Response**:
```json
{
  "success": true,
  "data": [
    {
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
        { "type": "CCS2", "powerKw": 150.0, "total": 4, "available": 3, "pricePerKWh": 0.38 }
      ],
      "rating": 4.8,
      "distanceKm": 2.8,
      "suitabilityScore": 94.5
    }
  ],
  "message": "Retrieved 6 charging stations."
}
```

---

## 5. Queue & Wait Time Prediction
- **Endpoint**: `POST /queue/predict`
- **Request Body**:
```json
{
  "stationId": "CS-CMB-001",
  "totalChargers": 4,
  "currentlyOccupied": 3,
  "arrivalHour": 17,
  "dayOfWeek": 3
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "stationId": "CS-CMB-001",
    "predictedQueueLength": 2,
    "estimatedWaitMinutes": 25,
    "availableChargersNow": 1,
    "congestionLevel": "Moderate",
    "source": "mock",
    "modelName": "QueuingTheory-Fallback",
    "hourlyForecast": [
      { "hour": "17:00", "predictedQueue": 2, "estimatedWaitMin": 25 },
      { "hour": "18:00", "predictedQueue": 3, "estimatedWaitMin": 35 }
    ],
    "timestamp": "2026-08-26T16:30:00Z"
  },
  "message": "Station queue and waiting time calculated successfully."
}
```

---

## 6. Route Optimization & Charging Stop Recommendation
- **Endpoint**: `POST /route/optimize`
- **Request Body**:
```json
{
  "originLat": 6.9344,
  "originLon": 79.8428,
  "originName": "Colombo Fort",
  "destLat": 6.0329,
  "destLon": 80.2168,
  "destName": "Galle Dutch Fort",
  "currentSoc": 35.0,
  "batteryCapacityKWh": 64.0,
  "consumptionKWhPer100Km": 15.5
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "origin": "Colombo Fort",
    "destination": "Galle Dutch Fort",
    "totalDistanceKm": 128.5,
    "estimatedDriveTimeMinutes": 118,
    "isChargingRequired": true,
    "currentEstimatedRangeKm": 144.5,
    "waypoints": [ ... ],
    "recommendedChargingStops": [
      {
        "stationId": "CS-GAL-005",
        "name": "Southern Expressway Pinnaduwa Hub",
        "distanceFromOriginKm": 68.0,
        "arrivalSocEstimated": 18.5,
        "recommendedChargeToSoc": 80.0,
        "estimatedChargeTimeMinutes": 24,
        "estimatedCost": 11.45,
        "chargerSpeedKw": 120.0,
        "connectorType": "CCS2"
      }
    ],
    "totalTripDurationMinutes": 142,
    "totalEstimatedTripCost": 11.45
  },
  "message": "Optimal route with charging recommendations calculated successfully."
}
```

---

## 7. Charging Time Estimator
- **Endpoint**: `POST /charging/estimate`
- **Request Body**:
```json
{
  "batteryCapacityKWh": 64.0,
  "currentSoc": 20.0,
  "targetSoc": 80.0,
  "chargerPowerKw": 50.0,
  "efficiency": 0.90
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "energyRequiredKWh": 38.4,
    "effectiveChargingPowerKw": 45.0,
    "chargingDurationMinutes": 51,
    "chargingDurationFormatted": "51 mins",
    "recommendedMaxSoc": 80.0,
    "curveAdjustmentFactor": 1.0
  },
  "message": "Charging duration and energy requirements estimated successfully."
}
```

---

## 8. Cost Analysis & Monthly Charging Summary
- **Endpoint**: `POST /cost/estimate`
- **Endpoint**: `GET /cost/monthly`
- **Response**:
```json
{
  "success": true,
  "data": {
    "month": "August",
    "year": 2026,
    "totalSessions": 5,
    "totalEnergyKWh": 145.1,
    "totalCost": 53.42,
    "avgCostPerSession": 10.68,
    "avgCostPerKWh": 0.368,
    "savingsVsPetrol": 85.47,
    "recentSessions": [ ... ]
  },
  "message": "Monthly cost and charging summary retrieved successfully."
}
```
