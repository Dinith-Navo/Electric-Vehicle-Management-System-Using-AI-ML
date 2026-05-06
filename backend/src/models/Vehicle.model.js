'use strict';
const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type    : mongoose.Schema.Types.ObjectId,
      ref     : 'User',
      required: true,
      index   : true,
    },
    make: {
      type    : String,
      required: [true, 'Vehicle make is required'],
      trim    : true,
    },
    model: {
      type    : String,
      required: [true, 'Vehicle model is required'],
      trim    : true,
    },
    year: {
      type    : Number,
      required: [true, 'Vehicle year is required'],
      min     : [2000, 'Year too old'],
      max     : [new Date().getFullYear() + 1, 'Invalid future year'],
    },
    vin: {
      type     : String,
      uppercase: true,
      trim     : true,
      default  : () => `EV${Date.now()}`,
    },
    batteryCapacity: {
      type   : Number,
      default: 75,
      min    : 10,
      max    : 250,
    },
    color: {
      type   : String,
      default: 'White',
      trim   : true,
    },
    licensePlate: {
      type     : String,
      uppercase: true,
      trim     : true,
      default  : '',
    },
    odometer: {
      type   : Number,
      default: 0,
      min    : 0,
    },
    category: {
      type   : String,
      enum   : ['Sedan', 'SUV', 'Truck', 'Van', 'Sports', 'Hatchback', 'Other'],
      default: 'Sedan',
    },
    isActive: {
      type   : Boolean,
      default: true,
    },
    // Last known telemetry snapshot (denormalized for quick access)
    lastTelemetry: {
      soc        : { type: Number },
      soh        : { type: Number },
      temperature: { type: Number },
      updatedAt  : { type: Date },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals : true,
      transform(_, ret) {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Virtual: display name ────────────────────────────────────────────────────
vehicleSchema.virtual('displayName').get(function () {
  return `${this.year} ${this.make} ${this.model}`;
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
