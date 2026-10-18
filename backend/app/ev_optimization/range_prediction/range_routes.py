from fastapi import APIRouter
from ..schemas import RangePredictRequest, RangePredictResult, StandardResponse
from .range_controller import RangePredictionController

router = APIRouter(tags=["Range Prediction"])

@router.post("/range/predict", response_model=StandardResponse[RangePredictResult])
async def predict_range_route(request: RangePredictRequest):
    return await RangePredictionController.predict_range_handler(request)
