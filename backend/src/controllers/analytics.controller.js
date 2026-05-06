'use strict';
const Telemetry = require('../models/Telemetry.model');
const Vehicle = require('../models/Vehicle.model');

// ─── GET /api/analytics/summary ───────────────────────────────────────────────
// Get aggregated stats for the dashboard
exports.getSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Aggregation for average SoH, Temp, Voltage across user's vehicles
    const stats = await Telemetry.aggregate([
      { $match: { owner: userId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$vehicle",
          latestSoH: { $first: "$soh" },
          latestTemp: { $first: "$temperature" },
          latestVoltage: { $first: "$voltage" },
          avgEfficiency: { $avg: "$efficiency" }
        }
      },
      {
        $group: {
          _id: null,
          avgSoH: { $avg: "$latestSoH" },
          avgTemp: { $avg: "$latestTemp" },
          avgVoltage: { $avg: "$latestVoltage" },
          avgEfficiency: { $avg: "$avgEfficiency" }
        }
      }
    ]);

    const summary = stats[0] || {
      avgSoH: 0,
      avgTemp: 0,
      avgVoltage: 0,
      avgEfficiency: 0
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
    
    const filter = { 
      owner: req.user._id, 
      createdAt: { $gte: since } 
    };
    if (vehicleId) filter.vehicle = vehicleId;

    // Group by day and calculate average for the requested metric
    const trends = await Telemetry.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          value: { $avg: `$${type || 'soh'}` }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const formattedTrends = trends.map(t => ({
      date: t._id,
      value: parseFloat(t.value.toFixed(2))
    }));

    res.json({ success: true, trends: formattedTrends });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/analytics/energy-usage ──────────────────────────────────────────
exports.getEnergyUsage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    // Mocking energy distribution for now (Drive, AC, Electronics, Idle)
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
