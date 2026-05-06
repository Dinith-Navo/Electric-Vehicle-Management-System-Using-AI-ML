'use strict';
const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema(
  {
    vehicle: {
      type : mongoose.Schema.Types.ObjectId,
      ref  : 'Vehicle',
      index: true,
    },
    owner: {
      type : mongoose.Schema.Types.ObjectId,
      ref  : 'User',
      index: true,
    },
    // Core battery metrics
    soc: {
      type   : Number,
      default: 80,
      min    : 0,
      max    : 100,
    },
    soh: {
      type   : Number,
      default: 95,
      min    : 0,
      max    : 100,
    },
    voltage: {
      type   : Number,
      default: 380,
    },
    current: {
      type   : Number,
      default: 0,
    },
    temperature: {
      type   : Number,
      default: 25,
    },
    efficiency: {
      type   : Number,
      default: 3.8,
    },
    power: {
      type   : Number,
      default: 0,
    },
    range: {
      type   : Number,
      default: 250,
    },
    chargingCycles: {
      type   : Number,
      default: 0,
      min    : 0,
    },
    chargingFrequency: {
      type   : Number,
      default: 0,
    },
    isCharging: {
      type   : Boolean,
      default: false,
    },
    // Metadata
    source: {
      type   : String,
      enum   : ['realtime', 'simulation', 'manual'],
      default: 'realtime',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_, ret) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for efficient range queries on time
telemetrySchema.index({ createdAt: -1 });
telemetrySchema.index({ vehicle: 1, createdAt: -1 });
telemetrySchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Telemetry', telemetrySchema);
