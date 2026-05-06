'use strict';
const jwt      = require('jsonwebtoken');
const User     = require('../models/User.model');
const Telemetry = require('../models/Telemetry.model');
const { predictBatteryHealth } = require('../utils/prediction.engine');
const logger = require('../utils/logger');

/**
 * Initializes the Socket.IO server for real-time telemetry streaming.
 *
 * Events emitted TO clients:
 *  - telemetry_update     : live telemetry snapshot every 3 seconds
 *  - prediction_update    : AI prediction result after each telemetry update
 *  - new_notification     : pushed when a critical alert is triggered
 *  - connection_confirmed : confirms authenticated socket connection
 *
 * Events received FROM clients:
 *  - authenticate         : { token } — joins user-specific room
 *  - telemetry_ping       : client heartbeat (optional)
 */
const initSocket = (io) => {

  // Map to hold active simulation intervals per socket
  const simIntervals = new Map();

  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    let authenticatedUserId = null;
    let vehicleContext      = null;

    // ── Authenticate Socket ────────────────────────────────────────────────
    socket.on('authenticate', async ({ token, vehicleId }) => {
      try {
        // Root fix: If the token is not a valid JWT, reject and disconnect the socket
        if (!token || !token.startsWith('ey') || token.split('.').length !== 3) {
          logger.error(`🚨 Security Violation: Malformed token from ${socket.id}. Disconnecting.`);
          socket.emit('auth_error', { success: false, message: 'Invalid token format. Please log in again.' });
          return socket.disconnect(true); 
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        const user    = await User.findById(decoded.id);
        if (!user || !user.isActive) throw new Error('Invalid user');

        authenticatedUserId = user._id.toString();
        vehicleContext      = vehicleId || null;

        // Join a private room for this user
        socket.join(`user_${authenticatedUserId}`);

        socket.emit('connection_confirmed', {
          success  : true,
          userId   : authenticatedUserId,
          message  : '✅ Authenticated. Real-time telemetry streaming started.',
        });

        logger.info(`✅ Socket authenticated for user: ${user.name} (${socket.id})`);

        // ── Start Telemetry Simulation Stream ──────────────────────────────
        startTelemetryStream(socket, authenticatedUserId, vehicleContext, simIntervals);

      } catch (err) {
        logger.error(`❌ Socket auth failed: ${err.message}`);
        socket.emit('auth_error', { success: false, message: err.message });
      }
    });

    // ── Client Heartbeat ───────────────────────────────────────────────────
    socket.on('telemetry_ping', () => {
      socket.emit('telemetry_pong', { ts: Date.now() });
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
      clearSimInterval(socket.id, simIntervals);
    });
  });

  // Attach io to module so index.js can call app.set('io', io)
  return io;
};

// ─── Simulation Stream ────────────────────────────────────────────────────────
/**
 * Simulates real-time telemetry streaming.
 * In production, replace this with actual OBD/CAN bus data ingestion.
 */
function startTelemetryStream(socket, userId, vehicleId, simIntervals) {
  clearSimInterval(socket.id, simIntervals);

  // Initial state
  let state = {
    soc              : 75 + Math.random() * 20,
    soh              : 88 + Math.random() * 10,
    voltage          : 370 + Math.random() * 30,
    current          : -10 + Math.random() * 5,
    temperature      : 26 + Math.random() * 10,
    efficiency       : 3.5 + Math.random() * 0.8,
    power            : 3  + Math.random() * 5,
    chargingCycles   : Math.floor(100 + Math.random() * 300),
    chargingFrequency: 2  + Math.random() * 4,
    isCharging       : Math.random() > 0.7,
    range            : 0,
  };

  const interval = setInterval(async () => {
    if (!socket.connected) {
      clearSimInterval(socket.id, simIntervals);
      return;
    }

    // Drift simulation
    state = evolveTelemetry(state);
    state.range = parseFloat((state.soc * 3.2).toFixed(1));

    // Emit live telemetry
    socket.emit('telemetry_update', state);

    // Every 10th tick, run AI prediction and emit
    if (Math.floor(Date.now() / 3000) % 10 === 0) {
      try {
        const prediction = predictBatteryHealth(state);
        socket.emit('prediction_update', prediction);
      } catch (_) {}
    }

    // Persist to DB (non-blocking)
    Telemetry.create({
      owner             : userId,
      vehicle           : vehicleId || undefined,
      ...state,
      source            : 'simulation',
    }).catch(() => {}); // silently ignore DB errors in simulation

  }, 3000);

  simIntervals.set(socket.id, interval);
}

// ─── Telemetry Evolution Model ────────────────────────────────────────────────
function evolveTelemetry(prev) {
  const isCharging = Math.random() > 0.7;
  const socDelta   = isCharging ? +(Math.random() * 0.8) : -(Math.random() * 0.5);

  return {
    soc              : parseFloat(Math.max(5, Math.min(100, prev.soc + socDelta)).toFixed(1)),
    soh              : parseFloat(Math.max(60, Math.min(100, prev.soh - 0.001)).toFixed(3)),
    voltage          : parseFloat((350 + Math.random() * 50).toFixed(1)),
    current          : parseFloat((isCharging ? 10 + Math.random() * 20 : -30 + Math.random() * 10).toFixed(1)),
    temperature      : parseFloat(Math.max(15, Math.min(55, prev.temperature + (Math.random() - 0.5) * 2)).toFixed(1)),
    efficiency       : parseFloat((3.5 + Math.random() * 0.8).toFixed(2)),
    power            : parseFloat((2 + Math.random() * 7).toFixed(1)),
    chargingCycles   : prev.chargingCycles,
    chargingFrequency: prev.chargingFrequency,
    isCharging,
    range            : 0,
  };
}

function clearSimInterval(socketId, map) {
  if (map.has(socketId)) {
    clearInterval(map.get(socketId));
    map.delete(socketId);
  }
}

module.exports = { initSocket };
