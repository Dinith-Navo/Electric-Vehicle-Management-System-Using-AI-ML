import os
import asyncio
from datetime import datetime, timezone, timedelta
import random

import logging

logger = logging.getLogger("smart_ev.database")

# ─── Try real MongoDB first, fallback to mongomock ───────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
_using_mock = False
_client = None
database = None

try:
    import pymongo
    # Quick probe: verify if real MongoDB is actually running and reachable
    _probe = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=1000)
    _probe.admin.command("ping")
    _probe.close()

    import motor.motor_asyncio
    _client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    database = _client.ev_management
    # Collections
    user_collection               = database.get_collection("users")
    vehicle_collection            = database.get_collection("vehicles")
    telemetry_collection          = database.get_collection("telemetry")
    charging_stations_collection  = database.get_collection("charging_stations")
    charging_sessions_collection  = database.get_collection("charging_sessions")
    prediction_logs_collection    = database.get_collection("prediction_logs")
    cost_records_collection       = database.get_collection("cost_records")
    _using_mock = False
    logger.info(f"✅ Connected to real MongoDB at {MONGO_URI}")
except Exception as _probe_err:
    logger.info(f"ℹ️ Real MongoDB offline at {MONGO_URI} ({_probe_err.__class__.__name__}). Falling back to in-memory mongomock.")
    _using_mock = True

if _using_mock:
    try:
        from mongomock_motor import AsyncMongoMockClient
        _client  = AsyncMongoMockClient()
        database = _client["ev_management"]
        user_collection               = database["users"]
        vehicle_collection            = database["vehicles"]
        telemetry_collection          = database["telemetry"]
        charging_stations_collection  = database["charging_stations"]
        charging_sessions_collection  = database["charging_sessions"]
        prediction_logs_collection    = database["prediction_logs"]
        cost_records_collection       = database["cost_records"]
    except ImportError:
        # Final fallback — stub collections
        class _Stub:
            def __init__(self, name): self.name = name
            async def insert_one(self, d): return type("R", (), {"inserted_id": "stub"})()
            async def find_one(self, q=None): return None
            def find(self, q=None):
                class C:
                    async def to_list(self, n=100): return []
                    def sort(self, *a, **k): return self
                    def limit(self, n): return self
                return C()
        user_collection = vehicle_collection = telemetry_collection = \
            charging_stations_collection = charging_sessions_collection = \
            prediction_logs_collection = cost_records_collection = _Stub("stub")

# ─── Seed demo data ───────────────────────────────────────────────────────────
_seeded = False

async def seed_demo_data():
    """Insert realistic demo vehicle data if collections are empty."""
    global _seeded
    if _seeded:
        return
    _seeded = True

    now = datetime.now(timezone.utc)
    VEHICLE_ID = "EV-001"

    # Vehicle record
    existing = await vehicle_collection.find_one({"vehicleId": VEHICLE_ID})
    if not existing:
        await vehicle_collection.insert_one({
            "vehicleId": VEHICLE_ID,
            "make": "Tesla",
            "model": "Model 3",
            "year": 2022,
            "batteryCapacity": 75.0,
            "status": "active",
            "registeredAt": now
        })

    # Telemetry records (last 10 readings)
    existing_t = await telemetry_collection.find_one({"vehicleId": VEHICLE_ID})
    if not existing_t:
        for i in range(10):
            ts = now - timedelta(minutes=i * 5)
            soc = round(72.0 - i * 0.3 + random.uniform(-0.5, 0.5), 1)
            await telemetry_collection.insert_one({
                "vehicleId": VEHICLE_ID,
                "batteryVoltage":     round(350.0 + random.uniform(-5, 5), 1),
                "batteryCurrent":     round(80.0  + random.uniform(-3, 3), 1),
                "batteryTemperature": round(35.0  + random.uniform(-2, 2), 1),
                "motorTemperature":   round(65.0  + random.uniform(-3, 3), 1),
                "vehicleSpeed":       round(random.uniform(0, 5), 1),
                "acceleration":       round(random.uniform(-0.5, 0.5), 2),
                "powerConsumption":   round(2.5   + random.uniform(-0.5, 0.5), 1),
                "soc":                max(0, min(100, soc)),
                "chargingStatus":     "NOT_CHARGING",
                "timestamp":          ts
            })

    # Battery SoH prediction log
    existing_p = await prediction_logs_collection.find_one({"vehicle_id": VEHICLE_ID})
    if not existing_p:
        await prediction_logs_collection.insert_one({
            "vehicle_id":        VEHICLE_ID,
            "current_soh":       87.3,
            "predicted_soh_3m":  85.8,
            "predicted_soh_6m":  83.2,
            "predicted_soh_12m": 79.1,
            "recommendation":    "Battery health is good. Schedule inspection in 6 months. Avoid frequent fast charging to slow degradation.",
            "avg_voltage":       350.2,
            "avg_current":       79.8,
            "avg_temperature":   34.9,
            "charging_sessions": 42,
            "created_at":        now
        })

    # Charging station
    existing_s = await charging_stations_collection.find_one({})
    if not existing_s:
        for i, (name, lat, lng) in enumerate([
            ("SLIIT Charging Hub", 6.9147, 79.9723),
            ("Colombo Fast Charge", 6.9271, 79.8612),
            ("Malabe EV Station",  6.9099, 79.9612),
        ]):
            await charging_stations_collection.insert_one({
                "stationId":    "ST-" + str(i+1).zfill(3),
                "name":         name,
                "latitude":     lat,
                "longitude":    lng,
                "available":    True,
                "maxKw":        50,
                "connectorType":"CCS2",
                "queueLength":  random.randint(0, 3)
            })

    # Charging sessions
    existing_ses = await charging_sessions_collection.find_one({})
    if not existing_ses:
        for s in [
            {
                "sessionId": "SES-0982",
                "vehicleId": VEHICLE_ID,
                "date": "2026-08-24",
                "stationName": "Colombo Fort Supercharge Hub",
                "energyKWh": 28.5,
                "durationMinutes": 24,
                "cost": 10.83,
                "chargerType": "CCS2 (150kW)"
            },
            {
                "sessionId": "SES-0975",
                "vehicleId": VEHICLE_ID,
                "date": "2026-08-19",
                "stationName": "SLIIT Charging Hub",
                "energyKWh": 22.0,
                "durationMinutes": 18,
                "cost": 7.70,
                "chargerType": "CCS2 (50kW)"
            }
        ]:
            await charging_sessions_collection.insert_one(s)
