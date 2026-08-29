from typing import Dict, Any
from ..schemas import DashboardOverviewData, RangePredictRequest, StationFilterParams
from ..range_prediction.range_service import RangePredictionService
from ..charging_stations.station_service import ChargingStationService
from ..cost_analysis.cost_service import CostAnalysisService
from database import vehicle_collection, telemetry_collection
import logging

logger = logging.getLogger(__name__)

class DashboardService:
    @staticmethod
    async def get_dashboard_data(user_lat: float = 6.9271, user_lon: float = 79.8612) -> DashboardOverviewData:
        vehicle_info = {
            "model": "Hyundai Kona Electric",
            "batteryCapacityKWh": 64.0,
            "batteryHealthSoH": 96.5,
            "currentSoc": 72.0,
            "energyConsumption": 14.8,
            "vin": "KMHEV81ABLA109823"
        }
        try:
            db_vehicle = await vehicle_collection.find_one({})
            if db_vehicle:
                vehicle_info["model"] = db_vehicle.get("model", vehicle_info["model"])
                vehicle_info["batteryCapacityKWh"] = float(db_vehicle.get("batteryCapacityKWh", 64.0))
                vehicle_info["vin"] = db_vehicle.get("vin", vehicle_info["vin"])
            
            db_telemetry = await telemetry_collection.find_one({}, sort=[("_id", -1)])
            if db_telemetry:
                vehicle_info["currentSoc"] = float(db_telemetry.get("soc", 72.0))
                vehicle_info["batteryHealthSoH"] = float(db_telemetry.get("soh", 96.5))
        except Exception as e:
            logger.debug(f"Telemetry/vehicle fetch notice: {e}")

        range_req = RangePredictRequest(
            soc=vehicle_info["currentSoc"],
            batteryCapacityKWh=vehicle_info["batteryCapacityKWh"],
            speedKmH=60.0,
            temperatureC=28.0,
            energyConsumptionKWhPer100Km=vehicle_info["energyConsumption"],
            acOn=True,
            drivingMode="Normal"
        )
        range_res = await RangePredictionService.predict_range(range_req)

        filters = StationFilterParams(userLat=user_lat, userLon=user_lon, sortBy="recommended")
        stations = await ChargingStationService.get_all_stations(filters)
        recommended_st = stations[0] if stations else None

        cost_summary = await CostAnalysisService.get_monthly_cost_summary()

        return DashboardOverviewData(
            vehicle=vehicle_info,
            currentSoc=vehicle_info["currentSoc"],
            estimatedRangeKm=range_res.remainingRangeKm,
            rangeConfidence=range_res.confidenceScore,
            rangeSource=range_res.source,
            nearbyStationsCount=len(stations),
            recommendedStation=recommended_st,
            recentChargingSessionsCount=cost_summary.totalSessions,
            monthlyCostToDate=cost_summary.totalCost,
            quickStats={
                "batteryHealth": vehicle_info["batteryHealthSoH"],
                "avgConsumption": f"{vehicle_info['energyConsumption']} kWh/100km",
                "nearestStationDistanceKm": recommended_st.get("distanceKm", 2.5) if recommended_st else 2.5,
                "savingsVsPetrolMonth": cost_summary.savingsVsPetrol
            }
        )
