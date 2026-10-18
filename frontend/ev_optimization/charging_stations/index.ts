export interface ChargerPort {
  type: string;
  powerKw: number;
  total: number;
  available: number;
  pricePerKWh: number;
}

export interface StationLocation {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

export interface ChargingStation {
  id?: string;
  stationId: string;
  name: string;
  operator: string;
  location: StationLocation;
  ports: ChargerPort[];
  rating: number;
  totalReviews: number;
  isOperational: boolean;
  amenities: string[];
  distanceKm?: number;
  suitabilityScore?: number;
  estimatedWaitMinutes?: number;
  queueLength?: number;
}
