import motor.motor_asyncio
import os

MONGO_DETAILS = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS)
database = client.ev_management

user_collection = database.get_collection("users")
vehicle_collection = database.get_collection("vehicles")
telemetry_collection = database.get_collection("telemetry")
