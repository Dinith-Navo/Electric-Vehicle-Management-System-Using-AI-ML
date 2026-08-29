from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os

from .api.range_prediction import router as range_router
from .api.queue_prediction import router as queue_router

app = FastAPI(
    title="SmartEV ML Prediction Microservice",
    description="Dedicated microservice for EV Range Prediction & Charging Queue Prediction models",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Prediction Routers
app.include_router(range_router)
app.include_router(queue_router)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "SmartEV ML Microservice",
        "port": 8001,
        "models": {
            "range": "Ready (trained model or fallback)",
            "queue": "Ready (trained model or fallback)"
        }
    }

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "SmartEV Machine Learning Inference Service is running.",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    port = int(os.getenv("ML_SERVICE_PORT", 8001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
