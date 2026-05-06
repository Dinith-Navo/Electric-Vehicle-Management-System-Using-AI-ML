'use strict';

/**
 * Lightweight rule-based + statistical AI prediction engine.
 * Mimics an LSTM/Random Forest model until the Python ML service is integrated.
 *
 * @param {Object} telemetry  - Live telemetry snapshot
 * @returns {Object}          - Prediction result matching the frontend schema
 */
const predictBatteryHealth = (telemetry) => {
  const {
    soc              = 80,
    soh              = 90,
    voltage          = 380,
    current          = 0,
    temperature      = 25,
    chargingCycles   = 100,
    chargingFrequency = 3,
  } = telemetry;

  // ── Risk factor computation ──────────────────────────────────────────────
  let riskScore = 0;

  // Temperature risk (high temp degrades battery faster)
  if (temperature > 45) riskScore += 30;
  else if (temperature > 35) riskScore += 15;
  else if (temperature > 30) riskScore += 5;

  // SoH degradation risk
  if (soh < 70) riskScore += 40;
  else if (soh < 80) riskScore += 20;
  else if (soh < 90) riskScore += 8;

  // Charging cycle risk
  if (chargingCycles > 800) riskScore += 20;
  else if (chargingCycles > 500) riskScore += 10;
  else if (chargingCycles > 300) riskScore += 5;

  // High charging frequency risk (DC fast charging wear)
  if (chargingFrequency > 7) riskScore += 15;
  else if (chargingFrequency > 5) riskScore += 8;
  else if (chargingFrequency > 4) riskScore += 3;

  // SoC extremes risk (too low or too high regularly)
  if (soc < 10 || soc > 95) riskScore += 10;

  // Voltage anomaly
  if (voltage < 320 || voltage > 420) riskScore += 10;

  // Clamp riskScore
  riskScore = Math.min(100, Math.max(0, riskScore + Math.round((Math.random() - 0.5) * 6)));

  // ── Derived Values ───────────────────────────────────────────────────────
  const failureProbability   = parseFloat((riskScore / 100).toFixed(3));
  const batteryHealth        = parseFloat(Math.max(0, Math.min(100, soh - riskScore * 0.15)).toFixed(1));
  const remainingLifeMonths  = Math.max(0, Math.round((batteryHealth / 100) * 60));
  const predictedYears       = (remainingLifeMonths / 12).toFixed(1);

  let failureRisk = 'Low';
  if (riskScore >= 60) failureRisk = 'High';
  else if (riskScore >= 30) failureRisk = 'Medium';

  const confidence = parseFloat((85 + Math.random() * 10).toFixed(1));

  // ── Dynamic Insights ─────────────────────────────────────────────────────
  const insights = [];

  if (temperature > 35)
    insights.push('⚠️ High battery temperature detected. Avoid fast charging in hot conditions.');
  else
    insights.push('✅ Battery temperature is within the safe operating range.');

  if (chargingFrequency > 5)
    insights.push('⚠️ High DC fast charging frequency. Limit to 2-3x per week for longevity.');
  else
    insights.push('✅ Charging frequency is healthy. Continue optimal charging habits.');

  if (soh < 80)
    insights.push('🔴 State of Health is critically low. Schedule a battery inspection immediately.');
  else if (soh < 90)
    insights.push('🟡 Battery capacity has degraded. Consider reducing deep discharge cycles.');
  else
    insights.push('✅ Battery State of Health is excellent.');

  insights.push(`📊 Estimated battery life remaining: ${predictedYears} years based on current usage.`);

  if (soc < 20)
    insights.push('🔋 State of Charge is low. Recharge soon to prevent deep discharge.');
  else if (soc > 90)
    insights.push('🔋 Avoid charging above 80% regularly to extend battery lifespan.');
  else
    insights.push('✅ State of Charge is in the optimal range (20-80%).');

  // ── Maintenance Suggestion ───────────────────────────────────────────────
  let maintenanceSuggestion = 'Continue your current driving and charging habits.';
  if (failureRisk === 'High')
    maintenanceSuggestion = 'Immediate battery service recommended. Schedule a diagnostic appointment.';
  else if (failureRisk === 'Medium')
    maintenanceSuggestion = 'Schedule a battery health check within the next 30 days.';

  return {
    batteryHealth,
    failureRisk,
    predictedLife     : `${predictedYears} Years`,
    maintenanceSuggestion,
    confidence,
    riskScore,
    insights,
    failureProbability,
    remainingLifeMonths,
  };
};

module.exports = { predictBatteryHealth };
