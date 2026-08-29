export interface RangePredictParams {
  soc: number;
  batteryCapacityKWh: number;
  speedKmH: number;
  temperatureC: number;
  energyConsumptionKWhPer100Km?: number;
  acOn?: boolean;
  drivingMode?: string;
  vehicleModel?: string;
}

export interface RangePredictOutput {
  remainingRangeKm: number;
  confidenceScore: number;
  source: "mock" | "trained-model";
  modelName: string;
  factors?: {
    usableEnergyKWh: number;
    effectiveConsumption: number;
    temperatureC: number;
  };
  timestamp: string;
}
