from fastapi import HTTPException, status
from typing import List, Dict, Any, Optional
from ..schemas import ChargingStationSchema, StationFilterParams, StandardResponse
from .charging_stations.service import ChargingStationService
import logging

logger = logging.getLogger(__name__)

class ChargingStationController:
    @staticmethod
    async def get_stations_handler(
        maxDistanceKm: Optional[float] = None,
        minPowerKw: Optional[float] = None,
        maxPricePerKWh: Optional[float] = None,
        connectorType: Optional[str] = None,
        minRating: Optional[float] = None,
        onlyAvailable: Optional[bool] = False,
        userLat: Optional[float] = 6.9271,
        userLon: Optional[float] = 79.8612,
        sortBy: Optional[str] = "recommended"
    ) -> StandardResponse[List[Dict[str, Any]]]:
        try:
            filters = StationFilterParams(
                maxDistanceKm=maxDistanceKm,
                minPowerKw=minPowerKw,
                maxPricePerKWh=maxPricePerKWh,
                connectorType=connectorType,
                minRating=minRating,
                onlyAvailable=onlyAvailable,
                userLat=userLat,
                userLon=userLon,
                sortBy=sortBy
            )
            stations = await ChargingStationService.get_all_stations(filters)
            return StandardResponse(
                success=True,
                data=stations,
                message=f"Retrieved {len(stations)} charging stations."
            )
        except Exception as e:
            logger.error(f"Error fetching stations: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch charging stations: {str(e)}"
            )

    @staticmethod
    async def get_station_by_id_handler(
        station_id: str,
        userLat: Optional[float] = 6.9271,
        userLon: Optional[float] = 79.8612
    ) -> StandardResponse[Dict[str, Any]]:
        try:
            station = await ChargingStationService.get_station_by_id(station_id, userLat, userLon)
            if not station:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Station with ID '{station_id}' not found."
                )
            return StandardResponse(
                success=True,
                data=station,
                message="Station details retrieved successfully."
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error fetching station {station_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch station details: {str(e)}"
            )
