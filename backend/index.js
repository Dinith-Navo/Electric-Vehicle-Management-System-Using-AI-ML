'use strict';
require('dotenv').config();

const express       = require('express');
const http          = require('http');
const { Server }    = require('socket.io');
const mongoose      = require('mongoose');
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

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['*'];

const io = new Server(server, {
  cors: {
    origin     : allowedOrigins,
    methods    : ['GET', 'POST'],
    credentials: true,
  },
  transports     : ['websocket', 'polling'],
  pingTimeout    : 20000,
  pingInterval   : 10000,
});

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin     : allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Trust Proxy (needed for rate-limiter behind reverse proxies / Expo) ──────
app.set('trust proxy', 1);

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs       : parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max            : parseInt(process.env.RATE_LIMIT_MAX       || '200',    10),
  standardHeaders: true,
  legacyHeaders  : false,
  handler        : (req, res) =>
    res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' }),
});
app.use('/api', globalLimiter);

// ─── Attach Socket.IO to app (controllers access via req.app.get('io')) ───────
app.set('io', io);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success  : true,
    status   : 'healthy',
    uptime   : Math.round(process.uptime()),
    env      : process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/vehicles',      vehicleRoutes);
app.use('/api/telemetry',     telemetryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/predictions',   predictionRoutes);
app.use('/api/analytics',     analyticsRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must have 4 params for Express to treat it as error middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({ success: false, message: messages.join(', ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ success: false, message: `${field} already exists.` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });

  console.error(`[ERROR] ${status} — ${err.message}`);

  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Socket.IO Initialization ─────────────────────────────────────────────────
initSocket(io);

const logger = require('./src/utils/logger');

// ─── MongoDB + Server Start ─────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS         : 45000,
  })
  .then(() => {
    logger.info('✅ MongoDB Atlas connected');
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
      logger.info(`📡 Socket.IO ready on ws://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    logger.error(`❌ MongoDB connection failed: ${err.message}`);
    logger.warn('⚠️ Server starting in OFFLINE mode (Database unavailable).');
    server.listen(PORT, () => {
      logger.info(`🚀 Server (Limited) running on http://localhost:${PORT}`);
    });
  });

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ Server and DB connection closed.');
      process.exit(0);
    });
  });
});

module.exports = { app, server, io };
