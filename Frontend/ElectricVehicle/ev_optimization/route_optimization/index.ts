export interface RouteOptimizeParams {
  originLat: number;
  originLon: number;
  originName?: string;
  destLat: number;
  destLon: number;
  destName?: string;
  currentSoc: number;
  batteryCapacityKWh: number;
  consumptionKWhPer100Km: number;
}

export interface RecommendedChargingStop {
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceFromOriginKm: number;
  arrivalSocEstimated: number;
  recommendedChargeToSoc: number;
  estimatedChargeTimeMinutes: number;
  estimatedCost: number;
  chargerSpeedKw: number;
  connectorType: string;
}

export interface RouteOptimizeOutput {
  origin: string;
  destination: string;
  totalDistanceKm: number;
  estimatedDriveTimeMinutes: number;
  isChargingRequired: boolean;
  currentEstimatedRangeKm: number;
  remainingRangeAtDestinationKm: number;
  waypoints: any[];
  recommendedChargingStops: RecommendedChargingStop[];
  totalTripDurationMinutes: number;
  totalEstimatedTripCost: number;
  energyRequiredKWh: number;
}
