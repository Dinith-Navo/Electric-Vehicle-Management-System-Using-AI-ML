'use strict';
const Prediction            = require('../models/Prediction.model');
const Telemetry             = require('../models/Telemetry.model');
const Notification          = require('../models/Notification.model');
const { predictBatteryHealth, predictSoC } = require('../utils/prediction.engine');
const trainer                 = require('../utils/model.trainer');

// ─── POST /api/predictions/train ─────────────────────────────────────────────
// Trigger an AI 'Training' session based on historical data
exports.trainModel = async (req, res, next) => {
  try {
    const { spawn } = require('child_process');
    const path = require('path');

    const historicalData = await Telemetry.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .limit(500);

    // 1. Internal Node.js weight optimization
    const weights = await trainer.train(historicalData);

    // 2. Trigger Python Random Forest Training for SoC model
    const trainScript = path.join(__dirname, '../../../ml-model/train.py');
    
    // On Windows, shell: true helps with finding the executable and handling paths
    const pythonProcess = spawn('python', [trainScript], { shell: true });

    let stderr = '';
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Python SoC Model retrained successfully.');
        res.json({
          success: true,
          message: 'AI Model trained and optimized for your vehicle profile.',
          weights,
          timestamp: new Date(),
        });
      } else {
        console.error('❌ Python Training failed:', stderr);
        res.status(500).json({ 
          success: false, 
          message: 'AI Training script failed. Please ensure dependencies are installed.',
          error: stderr 
        });
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('❌ Failed to start Python Training:', err.message);
      res.status(500).json({ success: false, message: 'Could not start AI Training engine.' });
    });

  } catch (err) {
    console.error('Training Controller Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/predictions ────────────────────────────────────────────────────
// Run AI prediction on provided telemetry snapshot and persist the result
exports.runPrediction = async (req, res, next) => {
  try {
    const {
      vehicleId,
      voltage, current, temperature,
      charging_cycles, charging_frequency,
      soc, soh,
    } = req.body;

    // Build telemetry snapshot
    const snapshot = {
      soc              : soc              ?? 80,
      soh              : soh              ?? 90,
      voltage          : voltage          ?? 380,
      current          : current          ?? 0,
      temperature      : temperature      ?? 25,
      chargingCycles   : charging_cycles  ?? 100,
      chargingFrequency: charging_frequency ?? 3,
    };

    // Call Python-based SoC AI model
    const aiSoc = await predictSoC(snapshot);
    snapshot.aiPredictedSoc = aiSoc;

    const result = predictBatteryHealth(snapshot);

    // Persist prediction to DB
    const prediction = await Prediction.create({
      owner                : req.user._id,
      vehicle              : vehicleId || undefined,
      ...result,
      inputSnapshot        : snapshot,
      predictedSoc         : aiSoc,
    });

    // Auto-generate a notification if risk is High
    if (result.failureRisk === 'High') {
      const notif = await Notification.create({
        owner   : req.user._id,
        vehicle : vehicleId || undefined,
        title   : '🚨 High Battery Failure Risk Detected',
        message : result.maintenanceSuggestion,
        type    : 'critical',
        priority: 'high',
      });

      if (req.app.get('io')) {
        req.app.get('io').to(`user_${req.user._id}`).emit('new_notification', notif);
      }
    }

    res.status(201).json({ success: true, prediction });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/predictions ─────────────────────────────────────────────────────
// Returns prediction history for the logged-in user
exports.getHistory = async (req, res, next) => {
  try {
    const predictions = await Prediction.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, count: predictions.length, predictions });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/predictions/latest ─────────────────────────────────────────────
// Returns the most recent prediction for the user
exports.getLatest = async (req, res, next) => {
  try {
    const prediction = await Prediction.findOne({ owner: req.user._id }).sort({ createdAt: -1 });
    if (!prediction) {
      return res.status(404).json({ success: false, message: 'No prediction found yet.' });
    }
    res.json({ success: true, prediction });
  } catch (err) {
    next(err);
  }
};
