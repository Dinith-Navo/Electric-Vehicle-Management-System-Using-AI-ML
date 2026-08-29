export interface QueuePredictParams {
  stationId: string;
  totalChargers?: number;
  currentlyOccupied?: number;
  arrivalHour?: number;
  dayOfWeek?: number;
  chargingSpeedKw?: number;
}

export interface HourlyForecastItem {
  hour: string;
  predictedQueue: number;
  estimatedWaitMin: number;
}

export interface QueuePredictOutput {
  stationId: string;
  predictedQueueLength: number;
  estimatedWaitMinutes: number;
  availableChargersNow: number;
  congestionLevel: "Low" | "Moderate" | "High";
  source: "mock" | "trained-model";
  modelName: string;
  hourlyForecast: HourlyForecastItem[];
  timestamp: string;
}
