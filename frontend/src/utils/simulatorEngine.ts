import { Telemetry, SimulatorScenario, ChargingStatus } from '../types/telemetry';

let motor_temp_state = 50.0;
let battery_temp_state = 35.0;
let soc_state = 72.0;

export function generateSimulatedTelemetry(
  vehicleId: string,
  scenario: SimulatorScenario,
  severityFactor: number = 0.5,
  noiseFactor: number = 0.1
): Telemetry {
  const noise = () => (Math.random() - 0.5) * noiseFactor * 10.0;

  let speed = 55.0 + noise();
  let accel = 0.5 + noise();
  let current = 45.0 + accel * 15.0 + noise();
  let voltage = 360.0 - (current * 0.05) + noise();
  let power = (voltage * current) / 1000.0;
  let chargingStatus: ChargingStatus = 'NOT_CHARGING';

  // Apply Scenario specific correlated changes
  switch (scenario) {
    case 'CITY_DRIVING':
      speed = 30.0 + Math.sin(Date.now() / 1000) * 15.0;
      accel = Math.sin(Date.now() / 500) * 2.0;
      current = 30.0 + accel * 25.0;
      break;

    case 'HIGHWAY_DRIVING':
      speed = 110.0 + noise();
      accel = 0.1;
      current = 75.0 + noise();
      break;

    case 'HEAVY_ACCELERATION':
      speed = 85.0 + noise();
      accel = 4.2 + (severityFactor * 2.0);
      current = 160.0 + (severityFactor * 50.0);
      break;

    case 'MOTOR_THERMAL_ANOMALY':
    case 'THERMAL_ANOMALY':
      motor_temp_state += 1.5 * (1.0 + severityFactor);
      current = 140.0 + (severityFactor * 60.0);
      power = 55.0 + (severityFactor * 20.0);
      break;

    case 'BATTERY_THERMAL_ANOMALY':
      battery_temp_state += 1.2 * (1.0 + severityFactor);
      current = 150.0 + (severityFactor * 40.0);
      break;

    case 'ELECTRICAL_ANOMALY':
    case 'VOLTAGE_INSTABILITY':
      voltage = 280.0 - (severityFactor * 60.0) + (Math.random() * 40.0);
      current = 220.0 + (severityFactor * 80.0);
      break;

    case 'CURRENT_SPIKE':
      current = 290.0 + (severityFactor * 80.0);
      voltage = 330.0 - (severityFactor * 30.0);
      break;

    case 'CHARGING_ANOMALY':
      chargingStatus = 'FAST_CHARGING';
      current = -200.0 - (severityFactor * 80.0);
      voltage = 450.0 + (severityFactor * 40.0);
      battery_temp_state += 0.8;
      break;

    case 'POWER_ANOMALY':
      power = 95.0 + (severityFactor * 40.0);
      speed = 25.0; // Disproportionate power draw at low speed
      current = 240.0;
      break;

    case 'COMBINED_ANOMALY':
      motor_temp_state += 1.2;
      battery_temp_state += 0.8;
      voltage = 300.0 - (severityFactor * 30.0);
      current = 260.0 + (severityFactor * 60.0);
      power = 85.0;
      break;

    case 'NORMAL_DRIVING':
    default:
      // Slowly decay thermal build up to normal baseline
      if (motor_temp_state > 50.0) motor_temp_state -= 0.5;
      if (battery_temp_state > 35.0) battery_temp_state -= 0.3;
      break;
  }

  // Correlated Physics Thermal Update
  motor_temp_state = Math.min(140.0, Math.max(30.0, motor_temp_state + (power * 0.01)));
  battery_temp_state = Math.min(80.0, Math.max(20.0, battery_temp_state + (Math.abs(current) * 0.005)));

  // SOC Update
  if (chargingStatus !== 'NOT_CHARGING') {
    soc_state = Math.min(100.0, soc_state + 0.1);
  } else {
    soc_state = Math.max(5.0, soc_state - (power * 0.002));
  }

  return {
    vehicleId,
    batteryVoltage: parseFloat(voltage.toFixed(1)),
    batteryCurrent: parseFloat(current.toFixed(1)),
    batteryTemperature: parseFloat(battery_temp_state.toFixed(1)),
    motorTemperature: parseFloat(motor_temp_state.toFixed(1)),
    vehicleSpeed: parseFloat(Math.max(0, speed).toFixed(1)),
    acceleration: parseFloat(accel.toFixed(2)),
    powerConsumption: parseFloat(((voltage * current) / 1000.0).toFixed(1)),
    soc: parseFloat(soc_state.toFixed(1)),
    chargingStatus,
    timestamp: new Date().toISOString()
  };
}
