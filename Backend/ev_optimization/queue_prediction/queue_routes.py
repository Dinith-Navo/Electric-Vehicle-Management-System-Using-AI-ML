from fastapi import APIRouter
from ..schemas import QueuePredictRequest, QueuePredictResult, StandardResponse
from .queue_controller import QueuePredictionController

router = APIRouter(tags=["Queue Prediction"])

@router.post("/queue/predict", response_model=StandardResponse[QueuePredictResult])
async def predict_queue_route(request: QueuePredictRequest):
    return await QueuePredictionController.predict_queue_handler(request)
