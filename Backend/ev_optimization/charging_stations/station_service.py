from typing import List, Optional, Dict, Any
from ..schemas import ChargingStationSchema, StationFilterParams
from ..recommendation.recommendation_service import RecommendationScoringEngine, calculate_haversine_distance
from database import charging_stations_collection
import logging

logger = logging.getLogger(__name__)

DEFAULT_STATIONS = [
    {
        "stationId": "CS-CMB-001",
        "name": "Colombo Fort Supercharge Hub",
        "operator": "ChargeNet LK",
        "location": {
            "address": "Lotus Road, Colombo 01",
            "city": "Colombo",
            "latitude": 6.9344,
            "longitude": 79.8428
        },
        "ports": [
            {"type": "CCS2", "powerKw": 150.0, "total": 4, "available": 3, "pricePerKWh": 0.38},
            {"type": "CHAdeMO", "powerKw": 50.0, "total": 2, "available": 1, "pricePerKWh": 0.32},
            {"type": "Type 2", "powerKw": 22.0, "total": 2, "available": 2, "pricePerKWh": 0.25}
        ],
        "rating": 4.8,
        "totalReviews": 56,
        "isOperational": True,
        "amenities": ["Restroom", "Coffee Shop", "Free WiFi", "24/7 Security"]
    },
    {
        "stationId": "CS-KOL-002",
        "name": "Kollupitiya Marine Drive Express",
        "operator": "Vega Charging",
        "location": {
            "address": "Marine Drive, Kollupitiya, Colombo 03",
            "city": "Colombo",
            "latitude": 6.9015,
            "longitude": 79.8510
        },
        "ports": [
            {"type": "CCS2", "powerKw": 120.0, "total": 2, "available": 1, "pricePerKWh": 0.35},
            {"type": "Type 2", "powerKw": 22.0, "total": 2, "available": 0, "pricePerKWh": 0.24}
        ],
        "rating": 4.6,
        "totalReviews": 34,
        "isOperational": True,
        "amenities": ["Ocean View Cafe", "Restroom"]
    },
    {
        "stationId": "CS-RAJ-003",
        "name": "Rajagiriya EcoCharge Center",
        "operator": "ChargeNet LK",
        "location": {
            "address": "Parliament Road, Rajagiriya",
            "city": "Sri Jayawardenepura Kotte",
            "latitude": 6.9090,
            "longitude": 79.8940
        },
        "ports": [
            {"type": "CCS2", "powerKw": 100.0, "total": 3, "available": 2, "pricePerKWh": 0.30},
            {"type": "CHAdeMO", "powerKw": 50.0, "total": 1, "available": 1, "pricePerKWh": 0.28}
        ],
        "rating": 4.4,
        "totalReviews": 21,
        "isOperational": True,
        "amenities": ["Supermarket", "Restroom", "ATM"]
    },
    {
        "stationId": "CS-NEG-004",
        "name": "Katunayake Airport Highway Fast Charger",
        "operator": "ElectriFlow",
        "location": {
            "address": "Colombo - Katunayake Expressway Exit, Katunayake",
            "city": "Negombo",
            "latitude": 7.1802,
            "longitude": 79.8841
        },
        "ports": [
            {"type": "CCS2", "powerKw": 180.0, "total": 6, "available": 4, "pricePerKWh": 0.42},
            {"type": "CHAdeMO", "powerKw": 60.0, "total": 2, "available": 2, "pricePerKWh": 0.35}
        ],
        "rating": 4.9,
        "totalReviews": 88,
        "isOperational": True,
        "amenities": ["24/7 Dining", "EV Lounge", "Restroom", "WiFi"]
    },
    {
        "stationId": "CS-GAL-005",
        "name": "Galle Fort Highway Station",
        "operator": "Southern EV Grid",
        "location": {
            "address": "Southern Expressway Pinnaduwa Interchange, Galle",
            "city": "Galle",
            "latitude": 6.0722,
            "longitude": 80.2455
        },
        "ports": [
            {"type": "CCS2", "powerKw": 120.0, "total": 4, "available": 3, "pricePerKWh": 0.36},
            {"type": "Type 2", "powerKw": 22.0, "total": 2, "available": 2, "pricePerKWh": 0.25}
        ],
        "rating": 4.7,
        "totalReviews": 49,
        "isOperational": True,
        "amenities": ["Food Court", "Restroom", "Playground"]
    },
    {
        "stationId": "CS-KAN-006",
        "name": "Kandy City Center Rapid Charge",
        "operator": "ChargeNet LK",
        "location": {
            "address": "Dalada Veediya, Kandy",
            "city": "Kandy",
            "latitude": 7.2906,
            "longitude": 80.6337
        },
        "ports": [
            {"type": "CCS2", "powerKw": 60.0, "total": 2, "available": 1, "pricePerKWh": 0.34},
            {"type": "Type 2", "powerKw": 22.0, "total": 3, "available": 2, "pricePerKWh": 0.22}
        ],
        "rating": 4.5,
        "totalReviews": 31,
        "isOperational": True,
        "amenities": ["Shopping Mall", "Restroom", "Cinema"]
    }
]

class ChargingStationService:
    @staticmethod
    async def get_all_stations(filters: Optional[StationFilterParams] = None) -> List[Dict[str, Any]]:
        user_lat = filters.userLat if (filters and filters.userLat is not None) else 6.9271
        user_lon = filters.userLon if (filters and filters.userLon is not None) else 79.8612

        db_stations = []
        try:
            cursor = charging_stations_collection.find({})
            async for doc in cursor:
                doc["id"] = str(doc.get("_id", ""))
                doc.pop("_id", None)
                db_stations.append(doc)
        except Exception as e:
            logger.warning(f"MongoDB stations lookup note: {e}")

        station_pool = db_stations if db_stations else [dict(s) for s in DEFAULT_STATIONS]
        ranked = RecommendationScoringEngine.rank_stations(station_pool, user_lat, user_lon)

        if not filters:
            return ranked

        filtered = []
        for s in ranked:
            if filters.maxDistanceKm is not None and s.get("distanceKm", 0) > filters.maxDistanceKm:
                continue

            if filters.minRating is not None and s.get("rating", 0) < filters.minRating:
                continue

            ports = s.get("ports", [])
            max_power = max([p.get("powerKw", 0) for p in ports], default=0)
            min_price = min([p.get("pricePerKWh", 999) for p in ports], default=999)
            total_avail = sum(p.get("available", 0) for p in ports)
            types = [p.get("type", "") for p in ports]

            if filters.minPowerKw is not None and max_power < filters.minPowerKw:
                continue

            if filters.maxPricePerKWh is not None and min_price > filters.maxPricePerKWh:
                continue

            if filters.connectorType and filters.connectorType not in types:
                continue

            if filters.onlyAvailable and total_avail == 0:
                continue

            filtered.append(s)

        if filters.sortBy == "distance":
            filtered.sort(key=lambda x: x.get("distanceKm", 9999))
        elif filters.sortBy == "price":
            filtered.sort(key=lambda x: min([p.get("pricePerKWh", 99) for p in x.get("ports", [])], default=99))
        elif filters.sortBy == "speed":
            filtered.sort(key=lambda x: max([p.get("powerKw", 0) for p in x.get("ports", [])], default=0), reverse=True)
        elif filters.sortBy == "rating":
            filtered.sort(key=lambda x: x.get("rating", 0), reverse=True)
        else:
            filtered.sort(key=lambda x: x.get("suitabilityScore", 0), reverse=True)

        return filtered

    @staticmethod
    async def get_station_by_id(station_id: str, user_lat: float = 6.9271, user_lon: float = 79.8612) -> Optional[Dict[str, Any]]:
        station = None
        try:
            station = await charging_stations_collection.find_one({"stationId": station_id})
            if station:
                station["id"] = str(station.get("_id", ""))
                station.pop("_id", None)
        except Exception as e:
            logger.debug(f"DB lookup failed for station {station_id}: {e}")

        if not station:
            for s in DEFAULT_STATIONS:
                if s["stationId"] == station_id:
                    station = dict(s)
                    break

        if station:
            st_loc = station.get("location", {})
            st_lat = st_loc.get("latitude", user_lat)
            st_lon = st_loc.get("longitude", user_lon)
            station["distanceKm"] = calculate_haversine_distance(user_lat, user_lon, st_lat, st_lon)
            station["suitabilityScore"] = RecommendationScoringEngine.compute_station_score(station, user_lat, user_lon)

        return station
