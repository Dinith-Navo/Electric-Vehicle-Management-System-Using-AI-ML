/**
 * Reusable Haversine Distance & Coordinate Validation Helper
 * Provides high-accuracy spherical distance calculations, bounds validation,
 * deduplication with stable IDs, and nearby station filtering.
 */

export interface LatLonCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Validates whether latitude and longitude are valid, finite, and in bounds.
 */
export function isValidCoordinate(
  lat?: number | null,
  lon?: number | null
): boolean {
  if (typeof lat !== "number" || typeof lon !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (isNaN(lat) || isNaN(lon)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  return true;
}

/**
 * Calculates Great-Circle distance in kilometers between two GPS coordinates
 * using the Haversine formula. Returns null if any coordinate is invalid.
 *
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers rounded to 1 decimal place, or null if coordinates are invalid.
 */
export function computeHaversineDistanceKm(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null
): number | null {
  if (!isValidCoordinate(lat1, lon1) || !isValidCoordinate(lat2, lon2)) {
    return null;
  }

  const R = 6371.0; // Earth mean radius in kilometers
  const dLat = (((lat2 as number) - (lat1 as number)) * Math.PI) / 180.0;
  const dLon = (((lon2 as number) - (lon1 as number)) * Math.PI) / 180.0;

  const radLat1 = ((lat1 as number) * Math.PI) / 180.0;
  const radLat2 = ((lat2 as number) * Math.PI) / 180.0;

  const a =
    Math.sin(dLat / 2.0) * Math.sin(dLat / 2.0) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(dLon / 2.0) *
      Math.sin(dLon / 2.0);

  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  const dist = R * c;

  return Math.round(dist * 10) / 10;
}

// Backwards-compatible alias for existing imports
export const computeClientDistance = computeHaversineDistanceKm;

/**
 * Formats distance into standard UI presentation (e.g., "2.4 km away").
 */
export function formatDistanceAway(distanceKm?: number | null): string {
  if (typeof distanceKm !== "number" || isNaN(distanceKm) || !Number.isFinite(distanceKm)) {
    return "Distance unavailable";
  }
  return `${distanceKm.toFixed(1)} km away`;
}

/**
 * Filters and sorts stations strictly within a maximum distance (default 10 km).
 * Deduplicates by stable ID and sorts nearest first.
 */
export function filterAndSortNearbyStations<T extends { stationId?: string; id?: string; distanceKm?: number | null }>(
  stations: T[],
  maxRadiusKm: number = 10.0
): T[] {
  const seenIds = new Set<string>();
  const nearby: T[] = [];

  for (const s of stations) {
    const id = s.stationId || s.id;
    if (id) {
      if (seenIds.has(id)) continue;
      seenIds.add(id);
    }

    if (
      typeof s.distanceKm === "number" &&
      !isNaN(s.distanceKm) &&
      Number.isFinite(s.distanceKm) &&
      s.distanceKm <= maxRadiusKm
    ) {
      nearby.push(s);
    }
  }

  // Sort nearest first (ascending distance)
  nearby.sort((a, b) => {
    const distA = a.distanceKm ?? Number.MAX_SAFE_INTEGER;
    const distB = b.distanceKm ?? Number.MAX_SAFE_INTEGER;
    return distA - distB;
  });

  return nearby;
}
