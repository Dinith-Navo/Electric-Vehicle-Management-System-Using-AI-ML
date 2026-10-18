import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")

FIREBASE_CREDENTIALS: str = os.getenv("FIREBASE_CREDENTIALS", "secrets/serviceAccountKey.json")
FIREBASE_CREDENTIAL_PATH: Path = BASE_DIR / FIREBASE_CREDENTIALS
MODEL_VERSION: str = os.getenv("MODEL_VERSION", "xgboost-v1")
MODEL_DIR: str = str(BASE_DIR / "models")
MODEL_DIR_PATH: Path = BASE_DIR / "models"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, extra="allow")

    PROJECT_NAME: str = "AI-Based EV Operational Anomaly Detection System (AIEVADS)"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_ev_anomaly_key_2026")

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = True

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:8081",
        "http://localhost:19006",
        "http://localhost:3000",
        "http://localhost:8000",
        "exp://*",
        "*"
    ]

    # Anomaly Thresholds
    THRESHOLD_NORMAL_MAX: float = 0.30
    THRESHOLD_LOW_MAX: float = 0.50
    THRESHOLD_MEDIUM_MAX: float = 0.70
    THRESHOLD_HIGH_MAX: float = 0.85
    THRESHOLD_CRITICAL_MAX: float = 1.00

    # Data Quality Threshold
    MIN_DATA_QUALITY_THRESHOLD: float = 0.60

    # Ensemble Model Weights
    WEIGHT_ISOLATION_FOREST: float = 0.30
    WEIGHT_ONE_CLASS_SVM: float = 0.30
    WEIGHT_AUTOENCODER: float = 0.40

    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", str(FIREBASE_CREDENTIAL_PATH))
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "aievads-ev-monitoring")
    USE_FIREBASE_MOCK: bool = True

    # Virtual assistant providers
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o")
    OPENROUTER_SITE_URL: str = os.getenv("OPENROUTER_SITE_URL", "")
    OPENROUTER_SITE_NAME: str = os.getenv("OPENROUTER_SITE_NAME", "SmartEV Assistant")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_HOST: str = os.getenv("PINECONE_HOST", "")
    PINECONE_EMBED_MODEL: str = os.getenv("PINECONE_EMBED_MODEL", "llama-text-embed-v2")

    # ML Models directory
    MODEL_DIR: str = MODEL_DIR
    MODEL_VERSION: str = MODEL_VERSION
    BASE_DIR: Path = BASE_DIR


settings = Settings()
