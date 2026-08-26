import os
import math
from typing import List, Dict, Any
from ..schemas import RouteOptimizeRequest, RouteOptimizeResult, RouteWaypoint, RecommendedChargingStop
from ..recommendation.recommendation.service import calculate_haversine_distance
from ..charging_stations.charging_station.service import ChargingStationService
import logging

logger = logging.getLogger(__name__)

class RouteOptimizationService:
    @staticmethod
    async def optimize_route(req: RouteOptimizeRequest) -> RouteOptimizeResult:
        # Distance calculation
        direct_dist_km = calculate_haversine_distance(req.originLat, req.originLon, req.destLat, req.destLon)
        # Driving route detour factor (~1.25x direct distance for road network)
        road_distance_km = round(direct_dist_km * 1.25, 1)
        if road_distance_km < 1.0:
            road_distance_km = 5.0

        # Estimated driving time at avg 65 km/h
        avg_speed_kmh = 65.0
        drive_time_minutes = int(round((road_distance_km / avg_speed_kmh) * 60))

        # Battery & Energy Calculations
        usable_energy_kwh = req.batteryCapacityKWh * (req.currentSoc / 100.0)
        consumption = max(5.0, req.consumptionKWhPer100Km)
        estimated_range_km = round((usable_energy_kwh / consumption) * 100.0, 1)

        energy_required_kwh = round((road_distance_km / 100.0) * consumption, 2)
        
        # Buffer reserve (15% SoC safety margin)
        safety_reserve_km = round((req.batteryCapacityKWh * 0.15 / consumption) * 100.0, 1)
        effective_safe_range_km = max(0.0, estimated_range_km - safety_reserve_km)

        is_charging_required = road_distance_km > effective_safe_range_km

        # Waypoints Generation (3 sample checkpoints along route)
        waypoints: List[RouteWaypoint] = []
        for i, frac in enumerate([0.25, 0.50, 0.75]):
            w_lat = req.originLat + (req.destLat - req.originLat) * frac
            w_lon = req.originLon + (req.destLon - req.originLon) * frac
            w_dist = round(road_distance_km * frac, 1)
            spent_energy = (w_dist / 100.0) * consumption
            remaining_kwh = max(0.0, usable_energy_kwh - spent_energy)
            est_soc = round((remaining_kwh / req.batteryCapacityKWh) * 100.0, 1)
            waypoints.append(RouteWaypoint(
                name=f"Checkpoint {i+1} ({int(frac*100)}%)",
                latitude=w_lat,
                longitude=w_lon,
                distanceFromOriginKm=w_dist,
                remainingSocEstimated=est_soc
            ))

        recommended_stops: List[RecommendedChargingStop] = []
        charging_time_total = 0
        charging_cost_total = 0.0

        if is_charging_required:
            # Query candidate charging stations near the midway corridor
            mid_lat = req.originLat + (req.destLat - req.originLat) * 0.5
            mid_lon = req.originLon + (req.destLon - req.originLon) * 0.5
            
            all_stations = await ChargingStationService.get_all_stations()
            # Find station closest to halfway point
            best_station = None
            min_mid_dist = float("inf")
            for st in all_stations:
                st_loc = st.get("location", {})
                d = calculate_haversine_distance(mid_lat, mid_lon, st_loc.get("latitude", mid_lat), st_loc.get("longitude", mid_lon))
                if d < min_mid_dist and st.get("isOperational", True):
                    min_mid_dist = d
                    best_station = st

            if best_station:
                st_loc = best_station.get("location", {})
                ports = best_station.get("ports", [{}])
                top_port = max(ports, key=lambda p: p.get("powerKw", 50), default={"powerKw": 120, "type": "CCS2", "pricePerKWh": 0.35})
                
                stop_dist = round(road_distance_km * 0.5, 1)
                spent_at_stop = (stop_dist / 100.0) * consumption
                arrival_soc = max(5.0, round(((usable_energy_kwh - spent_at_stop) / req.batteryCapacityKWh) * 100.0, 1))
                target_charge_soc = 80.0
                kwh_to_add = req.batteryCapacityKWh * ((target_charge_soc - arrival_soc) / 100.0)
                
                # Charging duration: Energy / (Power * 0.9 efficiency)
                charge_power = top_port.get("powerKw", 100.0)
                charge_minutes = int(round((kwh_to_add / (charge_power * 0.90)) * 60))
                price_per_kwh = top_port.get("pricePerKWh", 0.35)
                session_cost = round(kwh_to_add * price_per_kwh, 2)

                charging_time_total += charge_minutes
                charging_cost_total += session_cost

                recommended_stops.append(RecommendedChargingStop(
                    stationId=best_station.get("stationId", "CS-MID-01"),
                    name=best_station.get("name", "Corridor Fast Charger"),
                    latitude=st_loc.get("latitude", mid_lat),
                    longitude=st_loc.get("longitude", mid_lon),
                    distanceFromOriginKm=stop_dist,
                    arrivalSocEstimated=arrival_soc,
                    recommendedChargeToSoc=target_charge_soc,
                    estimatedChargeTimeMinutes=charge_minutes,
                    estimatedCost=session_cost,
                    chargerSpeedKw=charge_power,
                    connectorType=top_port.get("type", "CCS2")
                ))

        # Remaining range at final destination
        if is_charging_required and recommended_stops:
            remaining_range_dest = round(estimated_range_km + (req.batteryCapacityKWh * 0.60 / consumption * 100) - road_distance_km, 1)
        else:
            remaining_range_dest = max(0.0, round(estimated_range_km - road_distance_km, 1))

        return RouteOptimizeResult(
            origin=req.originName or f"{req.originLat:.3f}, {req.originLon:.3f}",
            destination=req.destName or f"{req.destLat:.3f}, {req.destLon:.3f}",
            totalDistanceKm=road_distance_km,
            estimatedDriveTimeMinutes=drive_time_minutes,
            isChargingRequired=is_charging_required,
            currentEstimatedRangeKm=estimated_range_km,
            remainingRangeAtDestinationKm=remaining_range_dest,
            waypoints=waypoints,
            recommendedChargingStops=recommended_stops,
            totalTripDurationMinutes=drive_time_minutes + charging_time_total,
            totalEstimatedTripCost=charging_cost_total,
            energyRequiredKWh=energy_required_kwh
        )
