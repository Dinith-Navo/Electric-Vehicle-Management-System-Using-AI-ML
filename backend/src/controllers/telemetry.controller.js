'use strict';
const Telemetry         = require('../models/Telemetry.model');
const Notification      = require('../models/Notification.model');
const { predictBatteryHealth } = require('../utils/prediction.engine');

// ─── GET /api/telemetry ───────────────────────────────────────────────────────
// Returns the latest telemetry record for the user (or a specific vehicle)
exports.getLatest = async (req, res, next) => {
  try {
    const filter = { owner: req.user._id };
    if (req.query.vehicleId) filter.vehicle = req.query.vehicleId;

    const telemetry = await Telemetry.findOne(filter).sort({ createdAt: -1 });
    if (!telemetry) {
      return res.status(404).json({ success: false, message: 'No telemetry data found.' });
    }
    res.json({ success: true, telemetry });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/telemetry/history ───────────────────────────────────────────────
// Returns time-series telemetry for the last N days (default 7)
exports.getHistory = async (req, res, next) => {
  try {
    const days   = parseInt(req.query.days || '7', 10);
    const since  = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filter = { owner: req.user._id, createdAt: { $gte: since } };

    if (req.query.vehicleId) filter.vehicle = req.query.vehicleId;

    const data = await Telemetry.find(filter)
      .sort({ createdAt: 1 })
      .select('soc soh voltage current temperature efficiency power isCharging createdAt')
      .limit(500);

    res.json({ success: true, count: data.length, history: data });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/telemetry ──────────────────────────────────────────────────────
// Ingest a new telemetry snapshot, run AI prediction, emit socket event
exports.postTelemetry = async (req, res, next) => {
  try {
    const {
      vehicleId, soc, soh, voltage, current, temperature,
      efficiency, power, range, chargingCycles, chargingFrequency,
      isCharging, source,
    } = req.body;

    const telemetry = await Telemetry.create({
      owner             : req.user._id,
      vehicle           : vehicleId || undefined,
      soc, soh, voltage, current, temperature,
      efficiency, power, range, chargingCycles, chargingFrequency,
      isCharging, source: source || 'manual',
    });

    // ── Anomaly-based notification generation ────────────────────────────
    const alerts = [];

    if (temperature > 45) {
      alerts.push({
        title   : '🌡️ Critical Temperature Alert',
        message : `Battery temperature reached ${temperature}°C. Stop charging and let it cool.`,
        type    : 'critical',
        priority: 'high',
      });
    } else if (temperature > 35) {
      alerts.push({
        title   : '⚠️ High Temperature Warning',
        message : `Battery temperature is elevated at ${temperature}°C. Reduce load if possible.`,
        type    : 'warning',
        priority: 'medium',
      });
    }

    if (soh < 70) {
      alerts.push({
        title   : '🔴 Battery Health Critical',
        message : `State of Health has dropped to ${soh}%. Immediate battery service recommended.`,
        type    : 'critical',
        priority: 'high',
      });
    } else if (soh < 80) {
      alerts.push({
        title   : '🟡 Battery Degradation Detected',
        message : `Battery health is at ${soh}%. Schedule a maintenance check.`,
        type    : 'warning',
        priority: 'medium',
      });
    }

    if (soc < 10) {
      alerts.push({
        title   : '🔋 Very Low Battery',
        message : `State of Charge is critically low at ${soc}%. Please charge immediately.`,
        type    : 'critical',
        priority: 'high',
      });
    }

    if (alerts.length > 0) {
      const notifications = alerts.map((a) => ({
        ...a,
        owner  : req.user._id,
        vehicle: vehicleId || undefined,
      }));
      await Notification.insertMany(notifications);

      // Emit via Socket.IO if available
      if (req.app.get('io')) {
        notifications.forEach((n) => {
          req.app.get('io').to(`user_${req.user._id}`).emit('new_notification', n);
        });
      }
    }

    res.status(201).json({ success: true, telemetry });
  } catch (err) {
    next(err);
  }
};
