'use strict';
require('dotenv').config();

const express       = require('express');
const http          = require('http');
const { Server }    = require('socket.io');
const { admin, db } = require('./src/config/firebase');
const cors          = require('cors');
const helmet        = require('helmet');
const morgan        = require('morgan');
const rateLimit     = require('express-rate-limit');

// ─── Route Imports ───────────────────────────────────────────────────────────
const authRoutes         = require('./src/routes/auth.routes');
const vehicleRoutes      = require('./src/routes/vehicle.routes');
const telemetryRoutes    = require('./src/routes/telemetry.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const userRoutes         = require('./src/routes/user.routes');
const predictionRoutes   = require('./src/routes/prediction.routes');
const analyticsRoutes    = require('./src/routes/analytics.routes');

// ─── Socket Handler ───────────────────────────────────────────────────────────
const { initSocket } = require('./src/socket/telemetry.socket');

// ─── App & Server Setup ───────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin     : true,
    methods    : ['GET', 'POST'],
    credentials: true,
  },
  transports     : ['websocket', 'polling'],
  pingTimeout    : 20000,
  pingInterval   : 10000,
});

// ─── 1. CORS (Must be at the very top) ─────────────────────────────────────────
app.use(cors({
  origin: true, // Echoes the requesting origin
  credentials: true,
}));

// ─── 2. JSON Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── 3. Basic Security & Logging ─────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── 4. Debug Request Logger ──────────────────────────────────────────────────
app.use((req, res, next) => {
  const logger = require('./src/utils/logger');
  logger.info(`[DEBUG] ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    const debugBody = { ...req.body };
    if (debugBody.password) debugBody.password = '********';
    logger.info(`[DEBUG] Body: ${JSON.stringify(debugBody)}`);
  }
  next();
});

// ─── 5. Trust Proxy ───────────────────────────────────────────────────────────
app.set('trust proxy', 1);

// ─── 6. Global Rate Limiter (Disabled for Debugging) ──────────────────────────
/*
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);
*/

app.set('io', io);

// ─── 7. API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/vehicles',      vehicleRoutes);
app.use('/api/telemetry',     telemetryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/predictions',   predictionRoutes);
app.use('/api/analytics',     analyticsRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const logger = require('./src/utils/logger');
  const status = err.status || err.statusCode || 500;
  logger.error(`[ERROR] ${status} — ${err.message}`);
  if (process.env.NODE_ENV === 'development') logger.error(err.stack);

  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Socket.IO Initialization ─────────────────────────────────────────────────
initSocket(io);

const logger = require('./src/utils/logger');

// ─── Firebase + Server Start ─────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

if (db) {
  logger.info('✅ Firebase Realtime Database connected');
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
    logger.info(`📡 Socket.IO ready on ws://localhost:${PORT}`);
  });
} else {
  logger.error('❌ Firebase connection failed.');
  logger.warn('⚠️ Server starting in OFFLINE mode (Database unavailable).');
  server.listen(PORT, () => {
    logger.info(`🚀 Server (Limited) running on http://localhost:${PORT}`);
  });
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server and connections closed.');
    process.exit(0);
  });
});

module.exports = { app, server, io };
