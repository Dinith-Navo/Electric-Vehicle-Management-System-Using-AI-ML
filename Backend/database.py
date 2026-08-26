import motor.motor_asyncio
import os

MONGO_DETAILS = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_DETAILS, serverSelectionTimeoutMS=1500)
database = client.ev_management

user_collection = database.get_collection("users")
vehicle_collection = database.get_collection("vehicles")
telemetry_collection = database.get_collection("telemetry")
charging_stations_collection = database.get_collection("charging_stations")
charging_sessions_collection = database.get_collection("charging_sessions")
prediction_logs_collection = database.get_collection("prediction_logs")
cost_records_collection = database.get_collection("cost_records")
