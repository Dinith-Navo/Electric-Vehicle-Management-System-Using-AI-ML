from fastapi import APIRouter, Query
from typing import Optional
from ..schemas import CostEstimateRequest, CostEstimateResult, MonthlyCostSummary, StandardResponse
from .cost_controller import CostAnalysisController

router = APIRouter(tags=["Cost Analysis"])

@router.post("/cost/estimate", response_model=StandardResponse[CostEstimateResult])
async def estimate_cost_route(request: CostEstimateRequest):
    return CostAnalysisController.estimate_cost_handler(request)

@router.get("/cost/monthly", response_model=StandardResponse[MonthlyCostSummary])
async def get_monthly_cost_route(
    month: Optional[str] = Query(None, description="Month name e.g. August"),
    year: Optional[int] = Query(None, description="Year e.g. 2026")
):
    return await CostAnalysisController.get_monthly_summary_handler(month, year)
