'use strict';
const User     = require('../models/User.model');
const bcrypt   = require('bcryptjs');

// ─── GET /api/users/me ────────────────────────────────────────────────────────
exports.getProfile = (req, res) => {
  res.json({ success: true, user: req.user.toJSON() });
};

// ─── PUT /api/users/me ────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['name', 'email', 'phone', 'avatar', 'role'];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new           : true,
      runValidators : true,
    });

    res.json({ success: true, message: 'Profile updated.', user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};


// ─── PUT /api/users/me/password ───────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both currentPassword and newPassword are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(422).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;   // pre-save hook hashes it
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/users/me ─────────────────────────────────────────────────────
exports.deleteAccount = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { isActive: false });
    res.json({ success: true, message: 'Account deactivated.' });
  } catch (err) {
    next(err);
  }
};
