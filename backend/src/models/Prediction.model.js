'use strict';
const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema(
  {
    owner: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : 'User',
      required: true,
      index   : true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref : 'Vehicle',
    },
    // ML output fields
    batteryHealth: {
      type   : Number,
      default: 90,
      min    : 0,
      max    : 100,
    },
    failureRisk: {
      type   : String,
      enum   : ['Low', 'Medium', 'High'],
      default: 'Low',
    },
    predictedLife: {
      type   : String,
      default: '3 Years',
    },
    maintenanceSuggestion: {
      type   : String,
      default: '',
    },
    confidence: {
      type   : Number,
      default: 85,
      min    : 0,
      max    : 100,
    },
    riskScore: {
      type   : Number,
      default: 20,
      min    : 0,
      max    : 100,
    },
    insights: {
      type   : [String],
      default: [],
    },
    failureProbability: {
      type   : Number,
      default: 0.1,
      min    : 0,
      max    : 1,
    },
    remainingLifeMonths: {
      type   : Number,
      default: 36,
      min    : 0,
    },
    // The telemetry snapshot used for prediction
    inputSnapshot: {
      soc              : Number,
      soh              : Number,
      voltage          : Number,
      current          : Number,
      temperature      : Number,
      chargingCycles   : Number,
      chargingFrequency: Number,
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

predictionSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
