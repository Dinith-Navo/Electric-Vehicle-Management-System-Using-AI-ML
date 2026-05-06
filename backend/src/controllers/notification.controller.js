'use strict';
const Notification = require('../models/Notification.model');

// ─── GET /api/notifications ───────────────────────────────────────────────────
exports.getAll = async (req, res, next) => {
  try {
    const filter = { owner: req.user._id };
    if (req.query.unread === 'true') filter.read = false;

    const notifications = await Notification.find(filter)
      .sort({ read: 1, timestamp: -1 })
      .limit(100);

    res.json({ success: true, count: notifications.length, notifications });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.json({ success: true, notification });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
exports.markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { owner: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true, message: `${result.modifiedCount} notifications marked as read.` });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────
exports.deleteOne = async (req, res, next) => {
  try {
    const result = await Notification.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/notifications ────────────────────────────────────────────────
exports.deleteAll = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ owner: req.user._id });
    res.json({ success: true, message: `${result.deletedCount} notifications deleted.` });
  } catch (err) {
    next(err);
  }
};
