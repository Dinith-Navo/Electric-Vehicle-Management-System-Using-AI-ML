export interface ChargingEstimateParams {
  batteryCapacityKWh: number;
  currentSoc: number;
  targetSoc: number;
  chargerPowerKw: number;
  efficiency?: number;
}

export interface ChargingEstimateOutput {
  energyRequiredKWh: number;
  effectiveChargingPowerKw: number;
  chargingDurationMinutes: number;
  chargingDurationFormatted: string;
  recommendedMaxSoc: number;
  curveAdjustmentFactor: number;
}
