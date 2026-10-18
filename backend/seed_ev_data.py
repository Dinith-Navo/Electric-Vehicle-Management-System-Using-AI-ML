import asyncio
import os
import motor.motor_asyncio

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

SAMPLE_VEHICLES = [
    {
        "model": "Hyundai Kona Electric",
        "manufacturer": "Hyundai",
        "batteryType": "Lithium-Ion Polymer",
        "batteryCapacityKWh": 64.0,
        "year": 2024,
        "vin": "KMHEV81ABLA109823",
        "drivingEfficiency": 14.8
    },
    {
        "model": "Nissan Leaf e+",
        "manufacturer": "Nissan",
        "batteryType": "Lithium-Ion",
        "batteryCapacityKWh": 62.0,
        "year": 2023,
        "vin": "JN1AZ0CP7MT049182",
        "drivingEfficiency": 16.2
    }
]

SAMPLE_TELEMETRY = [
    {
        "soc": 74.5,
        "soh": 96.8,
        "voltage": 392.4,
        "current": -14.2,
        "temperature": 28.5,
        "drivingEfficiency": 14.8,
        "speed": 58.0
    }
]

SAMPLE_STATIONS = [
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
            {"type": "CCS2", "powerKw": 150.0, "total": 4, "available": 3, "pricePerKWh": 0.38},
            {"type": "CHAdeMO", "powerKw": 50.0, "total": 2, "available": 1, "pricePerKWh": 0.32},
            {"type": "Type 2", "powerKw": 22.0, "total": 2, "available": 2, "pricePerKWh": 0.25}
        ],
        "rating": 4.8,
        "totalReviews": 56,
        "isOperational": True,
        "amenities": ["Restroom", "Coffee Shop", "Free WiFi", "24/7 Security"]
    },
    {
        "stationId": "CS-KOL-002",
        "name": "Kollupitiya Marine Drive Express",
        "operator": "Vega Charging",
        "location": {
            "address": "Marine Drive, Kollupitiya, Colombo 03",
            "city": "Colombo",
            "latitude": 6.9015,
            "longitude": 79.8510
        },
        "ports": [
            {"type": "CCS2", "powerKw": 120.0, "total": 2, "available": 1, "pricePerKWh": 0.35},
            {"type": "Type 2", "powerKw": 22.0, "total": 2, "available": 0, "pricePerKWh": 0.24}
        ],
        "rating": 4.6,
        "totalReviews": 34,
        "isOperational": True,
        "amenities": ["Ocean View Cafe", "Restroom"]
    },
    {
        "stationId": "CS-RAJ-003",
        "name": "Rajagiriya EcoCharge Center",
        "operator": "ChargeNet LK",
        "location": {
            "address": "Parliament Road, Rajagiriya",
            "city": "Sri Jayawardenepura Kotte",
            "latitude": 6.9090,
            "longitude": 79.8940
        },
        "ports": [
            {"type": "CCS2", "powerKw": 100.0, "total": 3, "available": 2, "pricePerKWh": 0.30},
            {"type": "CHAdeMO", "powerKw": 50.0, "total": 1, "available": 1, "pricePerKWh": 0.28}
        ],
        "rating": 4.4,
        "totalReviews": 21,
        "isOperational": True,
        "amenities": ["Supermarket", "Restroom", "ATM"]
    },
    {
        "stationId": "CS-NEG-004",
        "name": "Katunayake Airport Highway Fast Charger",
        "operator": "ElectriFlow",
        "location": {
            "address": "Colombo - Katunayake Expressway Exit, Katunayake",
            "city": "Negombo",
            "latitude": 7.1802,
            "longitude": 79.8841
        },
        "ports": [
            {"type": "CCS2", "powerKw": 180.0, "total": 6, "available": 4, "pricePerKWh": 0.42},
            {"type": "CHAdeMO", "powerKw": 60.0, "total": 2, "available": 2, "pricePerKWh": 0.35}
        ],
        "rating": 4.9,
        "totalReviews": 88,
        "isOperational": True,
        "amenities": ["24/7 Dining", "EV Lounge", "Restroom", "WiFi"]
    },
    {
        "stationId": "CS-GAL-005",
        "name": "Galle Fort Highway Station",
        "operator": "Southern EV Grid",
        "location": {
            "address": "Southern Expressway Pinnaduwa Interchange, Galle",
            "city": "Galle",
            "latitude": 6.0722,
            "longitude": 80.2455
        },
        "ports": [
            {"type": "CCS2", "powerKw": 120.0, "total": 4, "available": 3, "pricePerKWh": 0.36},
            {"type": "Type 2", "powerKw": 22.0, "total": 2, "available": 2, "pricePerKWh": 0.25}
        ],
        "rating": 4.7,
        "totalReviews": 49,
        "isOperational": True,
        "amenities": ["Food Court", "Restroom", "Playground"]
    },
    {
        "stationId": "CS-KAN-006",
        "name": "Kandy City Center Rapid Charge",
        "operator": "ChargeNet LK",
        "location": {
            "address": "Dalada Veediya, Kandy",
            "city": "Kandy",
            "latitude": 7.2906,
            "longitude": 80.6337
        },
        "ports": [
            {"type": "CCS2", "powerKw": 60.0, "total": 2, "available": 1, "pricePerKWh": 0.34},
            {"type": "Type 2", "powerKw": 22.0, "total": 3, "available": 2, "pricePerKWh": 0.22}
        ],
        "rating": 4.5,
        "totalReviews": 31,
        "isOperational": True,
        "amenities": ["Shopping Mall", "Restroom", "Cinema"]
    }
]

SAMPLE_SESSIONS = [
    {
        "sessionId": "SES-0982",
        "date": "2026-08-24",
        "stationName": "Colombo Fort Supercharge Hub",
        "energyKWh": 28.5,
        "durationMinutes": 24,
        "cost": 10.83,
        "chargerType": "CCS2 (150kW)"
    },
    {
        "sessionId": "SES-0975",
        "date": "2026-08-19",
        "stationName": "Kollupitiya Marine Drive",
        "energyKWh": 22.0,
        "durationMinutes": 18,
        "cost": 7.70,
        "chargerType": "CCS2 (120kW)"
    },
    {
        "sessionId": "SES-0961",
        "date": "2026-08-14",
        "stationName": "Rajagiriya EcoCharge",
        "energyKWh": 34.2,
        "durationMinutes": 32,
        "cost": 10.26,
        "chargerType": "CCS2 (100kW)"
    },
    {
        "sessionId": "SES-0948",
        "date": "2026-08-08",
        "stationName": "Katunayake Airport Highway Fast Charger",
        "energyKWh": 42.0,
        "durationMinutes": 35,
        "cost": 17.64,
        "chargerType": "CCS2 (180kW)"
    },
    {
        "sessionId": "SES-0933",
        "date": "2026-08-02",
        "stationName": "Colombo Fort Supercharge Hub",
        "energyKWh": 18.4,
        "durationMinutes": 16,
        "cost": 6.99,
        "chargerType": "CCS2 (150kW)"
    }
]

async def seed_database():
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    db = client.ev_management

    try:
        # Seed Vehicles
        await db.vehicles.delete_many({})
        await db.vehicles.insert_many(SAMPLE_VEHICLES)
        print(f"✅ Seeded {len(SAMPLE_VEHICLES)} vehicles.")

        # Seed Telemetry
        await db.telemetry.delete_many({})
        await db.telemetry.insert_many(SAMPLE_TELEMETRY)
        print(f"✅ Seeded {len(SAMPLE_TELEMETRY)} telemetry records.")

        # Seed Charging Stations
        await db.charging_stations.delete_many({})
        await db.charging_stations.insert_many(SAMPLE_STATIONS)
        print(f"✅ Seeded {len(SAMPLE_STATIONS)} charging stations.")

        # Seed Charging Sessions
        await db.charging_sessions.delete_many({})
        await db.charging_sessions.insert_many(SAMPLE_SESSIONS)
        print(f"✅ Seeded {len(SAMPLE_SESSIONS)} charging sessions.")

        print("🎉 Database seed completed successfully!")
    except Exception as e:
        print(f"⚠️ Seeding notice (MongoDB might not be running locally): {e}")
        print("Note: The application has built-in resilient fallback mock data and will function even if MongoDB is offline.")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
