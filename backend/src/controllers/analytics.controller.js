'use strict';
const Telemetry = require('../models/Telemetry.model');
const Vehicle = require('../models/Vehicle.model');

// ─── GET /api/analytics/summary ───────────────────────────────────────────────
// Get aggregated stats for the dashboard
exports.getSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Fetch all telemetry for this owner
    const allTelemetry = await Telemetry.find({ owner: userId });
    
    if (allTelemetry.length === 0) {
      return res.json({ 
        success: true, 
        summary: { avgSoH: 0, avgTemp: 0, avgVoltage: 0, avgEfficiency: 0 } 
      });
    }

    // Manual aggregation: Get latest for each vehicle
    const vehicleStats = {};
    allTelemetry.forEach(t => {
      const vid = t.vehicle;
      if (!vehicleStats[vid] || t.createdAt > vehicleStats[vid].createdAt) {
        vehicleStats[vid] = t;
      }
    });

    const latestLogs = Object.values(vehicleStats);
    const count = latestLogs.length;

    const summary = {
      avgSoH: latestLogs.reduce((acc, curr) => acc + (curr.soh || 0), 0) / count,
      avgTemp: latestLogs.reduce((acc, curr) => acc + (curr.temperature || 0), 0) / count,
      avgVoltage: latestLogs.reduce((acc, curr) => acc + (curr.voltage || 0), 0) / count,
      avgEfficiency: allTelemetry.reduce((acc, curr) => acc + (curr.efficiency || 0), 0) / allTelemetry.length
    };

    res.json({ success: true, summary });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/analytics/trends ────────────────────────────────────────────────
// Get historical trends for charts
exports.getTrends = async (req, res, next) => {
  try {
    const { vehicleId, type, days = 7 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const query = { owner: req.user.id };
    if (vehicleId) query.vehicle = vehicleId;

    const logs = await Telemetry.find(query);
    const filtered = logs.filter(l => new Date(l.createdAt) >= since);

    // Group by day in JS
    const groups = {};
    filtered.forEach(log => {
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      if (!groups[date]) groups[date] = { sum: 0, count: 0 };
      groups[date].sum += log[type || 'soh'] || 0;
      groups[date].count += 1;
    });

    const trends = Object.keys(groups).sort().map(date => ({
      date,
      value: parseFloat((groups[date].sum / groups[date].count).toFixed(2))
    }));

    res.json({ success: true, trends });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/analytics/energy-usage ──────────────────────────────────────────
exports.getEnergyUsage = async (req, res, next) => {
  try {
    res.json({
      success: true,
      usage: [
        { label: 'Drive', value: 65, color: '#00F0FF' },
        { label: 'AC', value: 15, color: '#10B981' },
        { label: 'Electronics', value: 10, color: '#8B5CF6' },
        { label: 'Idle', value: 10, color: '#F59E0B' }
      ]
    });
  } catch (err) {
    next(err);
  }
};

