/**
 * Smart EV Sri Lanka - Station Service & 20 Demo Station Registry
 * 
 * Provides verified data models, fallback registry, validation, and in-memory filtering.
 * Falls back safely to 20 local demo records if backend or Google Places API fails.
 */

import { evOptimizationApi, StationFilterParams } from "./apiClient";
import demoStationsJson from "../charging_stations/stations.json";

export interface StationPort {
  type: string; // "CCS2" | "CHAdeMO" | "Type 2"
  powerKw: number;
  total: number;
  available: number;
  pricePerKWh?: number;
  priceLkrPerKwh?: number;
}

export interface StationConnector {
  connectorId: string;
  type: string;
  powerKw: number;
  status: "available" | "occupied" | "charging" | "faulted" | "out_of_service";
  pricePerKWh?: number;
  priceLkrPerKwh?: number;
  lastUpdated?: string;
}

export interface StationLocation {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface Station {
  id?: string;
  stationId: string;
  name: string;
  operator: string;
  ownerId?: string | null;
  location: StationLocation;
  ports: StationPort[];
  connectors?: StationConnector[];
  rating: number;
  totalReviews: number;
  isOperational: boolean;
  amenities: string[];
  isDemo?: boolean;
  telemetryType?: string;
  pricingType?: string;
  dataSource?: string;
  sourceAttribution?: string;
  disclaimer?: string;
  tariffCurrency?: string;
  distanceKm?: number | null;
  suitabilityScore?: number;
  recommendationReason?: string;
  googleMapsUri?: string;
}

/**
 * Standard Haversine distance calculation in kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number" ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return 0;
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Validates Sri Lankan coordinates (Latitude: 5.9 - 9.9, Longitude: 79.5 - 82.0)
 */
export function isValidSriLankanCoordinate(lat: any, lon: any): boolean {
  if (typeof lat !== "number" || typeof lon !== "number" || isNaN(lat) || isNaN(lon)) {
    return false;
  }
  return lat >= 5.5 && lat <= 10.5 && lon >= 79.0 && lon <= 82.5;
}

/**
 * Sanitizes and validates a single station object, preventing negative prices, NaN, and duplicate structures
 */
export function sanitizeStation(raw: any, fallbackIndex = 0): Station {
  const stationId = typeof raw.stationId === "string" && raw.stationId.trim()
    ? raw.stationId.trim()
    : `DEMO-SL-${String(fallbackIndex + 1).padStart(3, "0")}`;

  const lat = typeof raw.location?.latitude === "number" && !isNaN(raw.location.latitude)
    ? raw.location.latitude
    : typeof raw.latitude === "number" && !isNaN(raw.latitude)
    ? raw.latitude
    : 6.9344;

  const lon = typeof raw.location?.longitude === "number" && !isNaN(raw.location.longitude)
    ? raw.location.longitude
    : typeof raw.longitude === "number" && !isNaN(raw.longitude)
    ? raw.longitude
    : 79.8428;

  const sanitizedPorts: StationPort[] = Array.isArray(raw.ports)
    ? raw.ports.map((p: any) => {
        const power = typeof p.powerKw === "number" && !isNaN(p.powerKw) && p.powerKw > 0 ? p.powerKw : 22.0;
        const total = typeof p.total === "number" && !isNaN(p.total) && p.total > 0 ? Math.floor(p.total) : 1;
        const avail = typeof p.available === "number" && !isNaN(p.available)
          ? Math.max(0, Math.min(total, Math.floor(p.available)))
          : total;
        const priceLkr = typeof p.priceLkrPerKwh === "number" && !isNaN(p.priceLkrPerKwh) && p.priceLkrPerKwh >= 0
          ? p.priceLkrPerKwh
          : power >= 150 ? 125.0 : power >= 100 ? 112.5 : power >= 50 ? 100.0 : power >= 20 ? 72.5 : 65.0;
        const priceUsd = typeof p.pricePerKWh === "number" && !isNaN(p.pricePerKWh) && p.pricePerKWh >= 0
          ? p.pricePerKWh
          : Math.round((priceLkr / 310) * 100) / 100;

        return {
          type: typeof p.type === "string" && p.type ? p.type : "CCS2",
          powerKw: power,
          total,
          available: avail,
          priceLkrPerKwh: priceLkr,
          pricePerKWh: priceUsd,
        };
      })
    : [
        { type: "CCS2", powerKw: 120.0, total: 2, available: 1, priceLkrPerKwh: 112.5, pricePerKWh: 0.36 },
        { type: "Type 2", powerKw: 22.0, total: 2, available: 2, priceLkrPerKwh: 72.5, pricePerKWh: 0.23 },
      ];

  const sanitizedConnectors: StationConnector[] = Array.isArray(raw.connectors) && raw.connectors.length > 0
    ? raw.connectors.map((c: any, cIdx: number) => ({
        connectorId: typeof c.connectorId === "string" ? c.connectorId : `${stationId}-C${cIdx + 1}`,
        type: typeof c.type === "string" ? c.type : "CCS2",
        powerKw: typeof c.powerKw === "number" && !isNaN(c.powerKw) ? Math.max(0, c.powerKw) : 22.0,
        status: ["available", "occupied", "charging", "faulted", "out_of_service"].includes(c.status)
          ? c.status
          : "available",
        priceLkrPerKwh: typeof c.priceLkrPerKwh === "number" && !isNaN(c.priceLkrPerKwh) ? Math.max(0, c.priceLkrPerKwh) : 72.5,
        pricePerKWh: typeof c.pricePerKWh === "number" && !isNaN(c.pricePerKWh) ? Math.max(0, c.pricePerKWh) : 0.23,
      }))
    : sanitizedPorts.flatMap((p) => {
        const cleanType = p.type.replace(/\s+/g, "");
        const res: StationConnector[] = [];
        for (let i = 1; i <= p.total; i++) {
          res.push({
            connectorId: `${stationId}-${cleanType}-${i}`,
            type: p.type,
            powerKw: p.powerKw,
            status: i <= p.available ? "available" : "occupied",
            priceLkrPerKwh: p.priceLkrPerKwh,
            pricePerKWh: p.pricePerKWh,
          });
        }
        return res;
      });

  return {
    stationId,
    name: typeof raw.name === "string" && raw.name.trim()
      ? raw.name.replace(/\s*\[DEMO\]/gi, "").trim()
      : `Sri Lanka EV Hub ${stationId}`,
    operator: typeof raw.operator === "string" && raw.operator.trim() ? raw.operator.trim() : "ChargeNET Demo",
    ownerId: raw.ownerId || null,
    location: {
      address: raw.location?.address || raw.address || "Main Road, Sri Lanka",
      city: raw.location?.city || raw.city || "Colombo",
      latitude: lat,
      longitude: lon,
    },
    ports: sanitizedPorts,
    connectors: sanitizedConnectors,
    rating: typeof raw.rating === "number" && !isNaN(raw.rating) ? Math.max(1, Math.min(5, raw.rating)) : 4.5,
    totalReviews: typeof raw.totalReviews === "number" && !isNaN(raw.totalReviews) ? Math.max(0, Math.floor(raw.totalReviews)) : 10,
    isOperational: raw.isOperational !== false,
    amenities: Array.isArray(raw.amenities) ? raw.amenities : ["Restroom", "24/7 Security"],
    isDemo: true,
    telemetryType: "DEMO TELEMETRY",
    pricingType: "DEMO PRICING",
    dataSource: "DEMO TELEMETRY",
    sourceAttribution: "Demonstration Data - Illustrative Tariffs (Simulated Sri Lanka EV Hub)",
    disclaimer: "Simulated demonstration data, not verified live charging stations or official tariffs.",
    tariffCurrency: "LKR",
    distanceKm: typeof raw.distanceKm === "number" && !isNaN(raw.distanceKm) ? raw.distanceKm : null,
    suitabilityScore: typeof raw.suitabilityScore === "number" && !isNaN(raw.suitabilityScore) ? raw.suitabilityScore : 85,
    recommendationReason: raw.recommendationReason,
    googleMapsUri: raw.googleMapsUri,
  };
}

/**
 * 20 Unique Demo Charging Stations distributed across Sri Lanka
 */
export const DEMO_STATIONS: Station[] = (demoStationsJson as any[]).map((st, idx) => sanitizeStation(st, idx));

/**
 * In-memory filter engine for local browsing and offline fallback
 */
export function filterStationsLocally(
  stations: Station[],
  filters?: StationFilterParams,
  userLocation = { latitude: 6.9344, longitude: 79.8428 }
): Station[] {
  let result = stations.map((st) => {
    const lat = st.location?.latitude ?? 6.9344;
    const lon = st.location?.longitude ?? 79.8428;
    const dist = calculateDistanceKm(userLocation.latitude, userLocation.longitude, lat, lon);
    return {
      ...st,
      distanceKm: dist,
    };
  });

  if (!filters) return result;

  // Search filter
  const query = (filters.search || filters.query || "").trim().toLowerCase();
  if (query) {
    result = result.filter(
      (st) =>
        st.name.toLowerCase().includes(query) ||
        st.operator.toLowerCase().includes(query) ||
        st.location.city.toLowerCase().includes(query) ||
        st.location.address.toLowerCase().includes(query)
    );
  }

  // Connector type filter
  if (filters.connectorType && filters.connectorType !== "all" && filters.connectorType !== "All") {
    result = result.filter((st) =>
      st.ports.some((p) => p.type.toLowerCase().includes(filters.connectorType!.toLowerCase()))
    );
  }

  // Minimum power in kW
  if (typeof filters.minPowerKw === "number" && filters.minPowerKw > 0) {
    result = result.filter((st) =>
      st.ports.some((p) => p.powerKw >= filters.minPowerKw!)
    );
  }

  // Maximum price per kWh (LKR or USD)
  if (typeof filters.maxPricePerKWh === "number" && filters.maxPricePerKWh > 0) {
    result = result.filter((st) =>
      st.ports.some((p) => {
        const prLkr = p.priceLkrPerKwh ?? 999;
        const prUsd = p.pricePerKWh ?? 999;
        return prLkr <= filters.maxPricePerKWh! || prUsd <= filters.maxPricePerKWh!;
      })
    );
  }

  // Available only
  if (filters.availableOnly || filters.onlyAvailable) {
    result = result.filter((st) =>
      st.ports.some((p) => p.available > 0)
    );
  }

  // Minimum rating
  if (typeof filters.minRating === "number" && filters.minRating > 0) {
    result = result.filter((st) => st.rating >= filters.minRating!);
  }

  // Maximum distance filter
  if (typeof filters.maxDistanceKm === "number" && filters.maxDistanceKm > 0) {
    result = result.filter((st) => st.distanceKm === null || st.distanceKm <= filters.maxDistanceKm!);
  }

  // Sorting
  const sortBy = filters.sortBy || "recommended";
  if (sortBy === "distance") {
    result.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  } else if (sortBy === "price") {
    result.sort((a, b) => {
      const minA = Math.min(...a.ports.map((p) => p.priceLkrPerKwh ?? 999));
      const minB = Math.min(...b.ports.map((p) => p.priceLkrPerKwh ?? 999));
      return minA - minB;
    });
  } else if (sortBy === "speed") {
    result.sort((a, b) => {
      const maxA = Math.max(...a.ports.map((p) => p.powerKw ?? 0));
      const maxB = Math.max(...b.ports.map((p) => p.powerKw ?? 0));
      return maxB - maxA;
    });
  } else if (sortBy === "rating") {
    result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  } else {
    // "recommended"
    result.sort((a, b) => (b.suitabilityScore ?? 80) - (a.suitabilityScore ?? 80));
  }

  return result;
}

/**
 * Primary station fetching function:
 * 1. Attempts to fetch stations from backend API
 * 2. If backend succeeds with >= 1 record, sanitizes and returns backend records
 * 3. If backend fails, is offline, or returns 0 records, seamlessly falls back to the 20 local demo stations
 */
export async function getChargingStations(
  filters?: StationFilterParams,
  userLocation = { latitude: 6.9344, longitude: 79.8428 }
): Promise<{ stations: Station[]; isFallback: boolean; error: string | null }> {
  try {
    const filtersWithCoords: StationFilterParams = {
      ...filters,
      userLat: filters?.userLat ?? userLocation.latitude,
      userLon: filters?.userLon ?? userLocation.longitude,
    };

    const res = await evOptimizationApi.getStations(filtersWithCoords);
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      const sanitized = res.data.map((st: any, idx: number) => {
        const s = sanitizeStation(st, idx);
        s.distanceKm = calculateDistanceKm(
          userLocation.latitude,
          userLocation.longitude,
          s.location.latitude,
          s.location.longitude
        );
        return s;
      });

      // Deduplicate by stationId
      const uniqueMap = new Map<string, Station>();
      sanitized.forEach((st: Station) => uniqueMap.set(st.stationId, st));
      const uniqueList = Array.from(uniqueMap.values());

      return {
        stations: uniqueList,
        isFallback: false,
        error: null,
      };
    }
  } catch (err: any) {
    console.warn("Backend station fetch failed, using 20 local demo stations fallback:", err.message);
  }

  // Graceful Fallback: Local 20 Demo Records
  const localFiltered = filterStationsLocally(DEMO_STATIONS, filters, userLocation);
  return {
    stations: localFiltered,
    isFallback: true,
    error: null,
  };
}
