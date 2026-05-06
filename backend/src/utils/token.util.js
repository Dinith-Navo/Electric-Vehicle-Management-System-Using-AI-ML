'use strict';
const jwt = require('jsonwebtoken');

/**
 * Generates a signed access JWT for a given user id.
 */
const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Generates a long-lived refresh JWT.
 */
const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

module.exports = { generateAccessToken, generateRefreshToken };
