import os

try:
    import motor.motor_asyncio
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
except (ImportError, Exception):
    class MockCollection:
        def __init__(self, name):
            self.name = name
            self.store = []

        async def insert_one(self, doc):
            self.store.append(doc)
            class InsertResult:
                inserted_id = f"mock_{len(self.store)}"
            return InsertResult()

        async def find_one(self, query):
            return None

        def find(self, query=None):
            class AsyncCursor:
                def __init__(self, data):
                    self.data = data
                async def to_list(self, length=100):
                    return self.data[:length]
            return AsyncCursor(self.store)

    user_collection = MockCollection("users")
    vehicle_collection = MockCollection("vehicles")
    telemetry_collection = MockCollection("telemetry")
    charging_stations_collection = MockCollection("charging_stations")
    charging_sessions_collection = MockCollection("charging_sessions")
    prediction_logs_collection = MockCollection("prediction_logs")
    cost_records_collection = MockCollection("cost_records")
    database = None
    client = None
