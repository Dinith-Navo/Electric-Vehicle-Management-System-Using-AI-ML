
export type BadgeType =
  | "good"
  | "warn"
  | "info"
  | "error";


export type Recommendation = {
  priority: "High" | "Medium" | "Low";
  title: string;
  message: string;
};


export type BatteryFormData = {
  vehicleModel?: string;
  currentHealth?: string;
  batteryAgeYears?: string;
  batteryAgeMonths?: string;
  odometerKm?: string;
  batteryNominalCapacityKwh?: string;
  batteryNominalVoltageV?: string;
  weeklyDrivingDistanceKm?: string;
  weeklyChargeSessions?: string;
  dcFastChargingSessions?: string;
  weeklyFastChargeFraction?: string;
  weeklyAvgSocStartPct?: string;
  weeklyAvgSocEndPct?: string;
  weeklyEnergyConsumptionKwhPer100km?: string;
  weeklyAvgChargeDurationMin?: string;
  batteryTemperatureC?: string;
  batteryPackVoltageV?: string;
  avgChargingCurrentA?: string;

  avgVoltage?: string;
  avgCurrent?: string;
  avgTemperature?: string;
  avgSocChange?: string;
  avgChargeDuration?: string;
  chargingSessions?: string;

  drivingStyle?: string;
  drivingMode?: string;
  chargingHabit?: string;
};


export type PredictionResponse = {
  status?: string;

  prediction_id?: string;

  current_soh?: number;


  soh_3m?: number | null;
  soh_6m?: number | null;
  soh_12m?: number | null;


  degradation_3m?: number | null;
  degradation_6m?: number | null;
  degradation_12m?: number | null;



  health_status?: string;

  risk_level?: string;

  model?: string;

  model_version?: string;

  feature_count?: number;



  models_available?: {
    "3m": boolean;
    "6m": boolean;
    "12m": boolean;
  };



  recommendations?: Recommendation[];
};
