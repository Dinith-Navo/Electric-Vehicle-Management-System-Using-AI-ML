export type ChargingStatus = 
  | 'NOT_CHARGING'
  | 'CHARGING'
  | 'FAST_CHARGING'
  | 'DISCHARGING'
  | 'REGENERATIVE_BRAKING';

export interface Telemetry {
  vehicleId: string;
  batteryVoltage: number;
  batteryCurrent: number;
  batteryTemperature: number;
  motorTemperature: number;
  vehicleSpeed: number;
  acceleration: number;
  powerConsumption: number;
  soc: number;
  chargingStatus: ChargingStatus;
  timestamp?: string;
}

export type SimulatorScenario =
  | 'NORMAL_DRIVING'
  | 'CITY_DRIVING'
  | 'HIGHWAY_DRIVING'
  | 'HEAVY_ACCELERATION'
  | 'THERMAL_ANOMALY'
  | 'BATTERY_THERMAL_ANOMALY'
  | 'MOTOR_THERMAL_ANOMALY'
  | 'ELECTRICAL_ANOMALY'
  | 'VOLTAGE_INSTABILITY'
  | 'CURRENT_SPIKE'
  | 'CHARGING_ANOMALY'
  | 'POWER_ANOMALY'
  | 'COMBINED_ANOMALY'
  | 'RANDOM_SCENARIO'
  // 🇱🇰 Authentic Sri Lankan EV Operational Scenarios
  | 'KANDY_INCLINE_THERMAL_STRESS'
  | 'ELLA_DESCENT_REGEN_SURGE'
  | 'COLOMBO_MONSOON_FLOOD_LEAKAGE'
  | 'CEB_GRID_BROWNOUT_CHARGING'
  | 'PETTAH_TRAFFIC_TUK_OVERLOAD'
  | 'REPACKED_LEAF_CELL_IMBALANCE'
  | 'SOUTHERN_EXPRESSWAY_HIGH_SPEED';
