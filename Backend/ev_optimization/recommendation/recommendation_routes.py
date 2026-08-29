from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from ..schemas import StandardResponse, StationFilterParams
from ..charging_stations.station_service import ChargingStationService

router = APIRouter(tags=["Recommendations"])

@router.get("/recommendations", response_model=StandardResponse[List[Dict[str, Any]]])
async def get_top_recommendations_route(
    userLat: Optional[float] = Query(6.9271),
    userLon: Optional[float] = Query(79.8612),
    limit: Optional[int] = Query(3, ge=1, le=10)
):
    filters = StationFilterParams(userLat=userLat, userLon=userLon, sortBy="recommended")
    stations = await ChargingStationService.get_all_stations(filters)
    top_stations = stations[:limit]
    return StandardResponse(
        success=True,
        data=top_stations,
        message=f"Top {len(top_stations)} recommended charging stations."
    )
