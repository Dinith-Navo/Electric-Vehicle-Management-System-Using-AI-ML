import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True)

    PROJECT_NAME: str = "AI-Based EV Operational Anomaly Detection System (AIEVADS)"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super_secret_ev_anomaly_key_2026"
    
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
    
    # Anomaly Thresholds (Configurable constants - §14)
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
    FIREBASE_CREDENTIALS_PATH: str = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "aievads-ev-monitoring")
    USE_FIREBASE_MOCK: bool = True
    
    # ML Models directory
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")

settings = Settings()
