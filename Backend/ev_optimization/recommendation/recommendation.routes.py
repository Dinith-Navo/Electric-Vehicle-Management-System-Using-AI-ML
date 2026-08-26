from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from ..schemas import StandardResponse, StationFilterParams
from ..charging_stations.charging_station.service import ChargingStationService

router = APIRouter(tags=["Recommendations"])

@router.get("/recommendations", response_model=StandardResponse[List[Dict[str, Any]]])
async def get_top_recommendations_route(
    userLat: Optional[float] = Query(6.9271),
    userLon: Optional[float] = Query(79.8612),
    limit: Optional[int] = Query(3, ge=1, le=10)
):
    """
    Returns top ranked EV charging stations based on weighted multi-factor scoring
    (distance, availability, charging power, pricing, rating, and queue length).
    """
    filters = StationFilterParams(userLat=userLat, userLon=userLon, sortBy="recommended")
    stations = await ChargingStationService.get_all_stations(filters)
    top_stations = stations[:limit]
    return StandardResponse(
        success=True,
        data=top_stations,
        message=f"Top {len(top_stations)} recommended charging stations."
    )
