'use strict';
const User                              = require('../models/User.model');
const { generateAccessToken,
        generateRefreshToken }          = require('../utils/token.util');
const jwt                               = require('jsonwebtoken');

// ─── POST /api/auth/register ──────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  const logger = require('../utils/logger');
  try {
    const { name, email, password } = req.body;
    logger.info(`[AUTH] Registration attempt: ${email}`);

    if (!name || !email || !password) {
      logger.warn(`[AUTH] Registration failed: Missing fields for ${email}`);
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`[AUTH] Registration failed: Email ${email} already in use.`);
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }

    logger.info(`[AUTH] Creating user in database: ${email}`);
    const user = await User.create({ name, email, password });
    
    if (!user) {
      throw new Error('User creation failed - no user object returned');
    }

    logger.info(`[AUTH] User created successfully: ${user.id || user._id}. Generating tokens...`);

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    logger.info(`[AUTH] Tokens generated. Updating user with refresh token...`);
    user.refreshToken = refreshToken;
    user.lastLogin    = new Date();
    await user.save();

    logger.info(`[AUTH] Registration complete for ${email}. Sending response.`);
    res.status(201).json({
      success     : true,
      message     : 'Registration successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user        : user.toJSON(),
    });
  } catch (err) {
    logger.error(`❌ [AUTH] Registration Error: ${err.message}`);
    logger.error(err.stack);
    next(err);
  }
};


// ─── POST /api/auth/login ─────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    const accessToken  = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin    = new Date();
    await user.save({ validateModifiedOnly: true });

    res.json({
      success      : true,
      message      : 'Login successful',
      access_token : accessToken,
      refresh_token: refreshToken,
      user         : user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────
exports.refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refresh_token) {
      return res.status(401).json({ success: false, message: 'Refresh token mismatch.' });
    }

    const accessToken     = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateModifiedOnly: true });

    res.json({
      success      : true,
      access_token : accessToken,
      refresh_token: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: '' } });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
};
