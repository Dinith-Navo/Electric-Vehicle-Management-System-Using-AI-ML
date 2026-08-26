from fastapi import APIRouter
from ..schemas import ChargingEstimateRequest, ChargingEstimateResult, StandardResponse
from .charging_estimator.charging_time.controller import ChargingTimeController

router = APIRouter(tags=["Charging Estimator"])

@router.post("/charging/estimate", response_model=StandardResponse[ChargingEstimateResult])
async def estimate_charging_time_route(request: ChargingEstimateRequest):
    return ChargingTimeController.estimate_charging_time_handler(request)
