import os
from pathlib import Path
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")


FIREBASE_CREDENTIALS = os.getenv(
    "FIREBASE_CREDENTIALS",
    "secrets/serviceAccountKey.json"
)

MODEL_VERSION = os.getenv(
    "MODEL_VERSION",
    "xgboost-v1"
)

FIREBASE_CREDENTIAL_PATH = (
    BASE_DIR / FIREBASE_CREDENTIALS
)

MODEL_DIR = BASE_DIR / "models"