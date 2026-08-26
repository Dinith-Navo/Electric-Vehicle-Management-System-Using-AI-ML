from fastapi import APIRouter, Query
from typing import Optional, List, Dict, Any
from ..schemas import StandardResponse
from .charging_stations.controller import ChargingStationController

router = APIRouter(tags=["Charging Stations"])

@router.get("/stations", response_model=StandardResponse[List[Dict[str, Any]]])
async def get_stations_route(
    maxDistanceKm: Optional[float] = Query(None, description="Max radius in km"),
    minPowerKw: Optional[float] = Query(None, description="Minimum charging power in kW"),
    maxPricePerKWh: Optional[float] = Query(None, description="Max acceptable price per kWh"),
    connectorType: Optional[str] = Query(None, description="Connector type (CCS2, CHAdeMO, Type 2)"),
    minRating: Optional[float] = Query(None, description="Minimum user rating (0-5)"),
    onlyAvailable: Optional[bool] = Query(False, description="Filter only stations with free stalls"),
    userLat: Optional[float] = Query(6.9271, description="User latitude"),
    userLon: Optional[float] = Query(79.8612, description="User longitude"),
    sortBy: Optional[str] = Query("recommended", description="Sorting criteria: recommended, distance, price, speed, rating")
):
    return await ChargingStationController.get_stations_handler(
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

@router.get("/stations/{station_id}", response_model=StandardResponse[Dict[str, Any]])
async def get_station_by_id_route(
    station_id: str,
    userLat: Optional[float] = Query(6.9271),
    userLon: Optional[float] = Query(79.8612)
):
    return await ChargingStationController.get_station_by_id_handler(station_id, userLat, userLon)
