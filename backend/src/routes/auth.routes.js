'use strict';
const { Router }   = require('express');
const { body }     = require('express-validator');
const ctrl         = require('../controllers/auth.controller');
const { protect }  = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const rateLimit    = require('express-rate-limit');

const router = Router();

// Strict rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max     : 20,
  message : { success: false, message: 'Too many attempts. Try again after 15 minutes.' },
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  ctrl.register
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  ctrl.login
);

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
router.post('/refresh', ctrl.refresh);

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
router.post('/logout', protect, ctrl.logout);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, ctrl.getMe);

module.exports = router;
