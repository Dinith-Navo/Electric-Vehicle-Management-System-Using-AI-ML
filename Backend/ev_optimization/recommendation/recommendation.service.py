import math
from typing import List, Dict, Any

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two GPS coordinates using Haversine formula."""
    R = 6371.0  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class RecommendationScoringEngine:
    """
    Multi-Factor Recommendation Engine for EV Charging Stations.
    
    Suitability Score = (w_d * S_dist) + (w_a * S_avail) + (w_s * S_speed) 
                        + (w_c * S_cost) + (w_r * S_rating) + (w_q * S_queue)
    """
    WEIGHTS = {
        "distance": 0.25,
        "availability": 0.20,
        "speed": 0.20,
        "cost": 0.15,
        "rating": 0.10,
        "queue": 0.10,
    }

    @classmethod
    def compute_station_score(cls, station: Dict[str, Any], user_lat: float, user_lon: float) -> float:
        st_loc = station.get("location", {})
        st_lat = st_loc.get("latitude", user_lat)
        st_lon = st_loc.get("longitude", user_lon)
        dist_km = calculate_haversine_distance(user_lat, user_lon, st_lat, st_lon)
        
        # 1. Distance score (0 to 1, higher is closer)
        s_dist = max(0.0, 1.0 - (dist_km / 50.0))

        # 2. Availability score
        ports = station.get("ports", [])
        total_ports = sum(p.get("total", 1) for p in ports) or 1
        avail_ports = sum(p.get("available", 0) for p in ports)
        s_avail = avail_ports / float(total_ports)

        # 3. Charging Speed score (max 350kW)
        max_power = max([p.get("powerKw", 50.0) for p in ports], default=50.0)
        s_speed = min(1.0, max_power / 150.0)

        # 4. Cost score (cheaper is better, benchmark $0.50/kWh)
        min_price = min([p.get("pricePerKWh", 0.35) for p in ports], default=0.35)
        s_cost = max(0.0, 1.0 - (min_price / 0.70))

        # 5. Rating score (0 to 5 normalized to 0 to 1)
        rating = float(station.get("rating", 4.0))
        s_rating = rating / 5.0

        # 6. Queue score (shorter wait is better)
        est_wait = station.get("estimatedWaitMinutes", 0) or 0
        s_queue = max(0.0, 1.0 - (est_wait / 45.0))

        # Weighted aggregate
        w = cls.WEIGHTS
        score = (
            w["distance"] * s_dist +
            w["availability"] * s_avail +
            w["speed"] * s_speed +
            w["cost"] * s_cost +
            w["rating"] * s_rating +
            w["queue"] * s_queue
        )
        return round(score * 100.0, 1)

    @classmethod
    def rank_stations(cls, stations: List[Dict[str, Any]], user_lat: float, user_lon: float) -> List[Dict[str, Any]]:
        for st in stations:
            st_loc = st.get("location", {})
            st_lat = st_loc.get("latitude", user_lat)
            st_lon = st_loc.get("longitude", user_lon)
            st["distanceKm"] = calculate_haversine_distance(user_lat, user_lon, st_lat, st_lon)
            st["suitabilityScore"] = cls.compute_station_score(st, user_lat, user_lon)

        # Sort descending by suitability score
        stations.sort(key=lambda s: s.get("suitabilityScore", 0.0), reverse=True)
        return stations
