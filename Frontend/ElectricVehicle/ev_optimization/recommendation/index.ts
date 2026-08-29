import { ChargingStation } from "../charging_stations";

export interface StationRecommendationOutput {
  recommendedStation: ChargingStation;
  suitabilityScore: number;
  reason: string;
  comparisonStations: ChargingStation[];
}

export interface RecommendationWeights {
  distanceWeight: number;
  powerWeight: number;
  priceWeight: number;
  ratingWeight: number;
  availabilityWeight: number;
  queueWaitWeight: number;
}
