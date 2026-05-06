'use strict';
const Vehicle = require('../models/Vehicle.model');

// ─── GET /api/vehicles ────────────────────────────────────────────────────────
exports.getVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ owner: req.user._id, isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: vehicles.length, vehicles });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/vehicles ───────────────────────────────────────────────────────
exports.createVehicle = async (req, res, next) => {
  try {
    const { make, model, year, vin, batteryCapacity, color, licensePlate, odometer, category } = req.body;

    const vehicle = await Vehicle.create({
      owner: req.user._id,
      make, model, year, vin, batteryCapacity, color, licensePlate, odometer, category,
    });

    res.status(201).json({ success: true, message: 'Vehicle added successfully.', vehicle });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'VIN already registered.' });
    }
    next(err);
  }
};

// ─── GET /api/vehicles/:id ────────────────────────────────────────────────────
exports.getVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }
    res.json({ success: true, vehicle });
  } catch (err) {
    next(err);
  }
};

// ─── PUT /api/vehicles/:id ────────────────────────────────────────────────────
exports.updateVehicle = async (req, res, next) => {
  try {
    const allowed = ['make', 'model', 'year', 'batteryCapacity', 'color', 'licensePlate', 'odometer', 'category'];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    res.json({ success: true, message: 'Vehicle updated.', vehicle });
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/vehicles/:id ─────────────────────────────────────────────────
exports.deleteVehicle = async (req, res, next) => {
  try {
    // Soft delete
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    }

    res.json({ success: true, message: 'Vehicle removed.' });
  } catch (err) {
    next(err);
  }
};
