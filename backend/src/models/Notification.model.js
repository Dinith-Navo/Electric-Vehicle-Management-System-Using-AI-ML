'use strict';
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
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
    title: {
      type    : String,
      required: [true, 'Title is required'],
      trim    : true,
      maxlength: 120,
    },
    message: {
      type    : String,
      required: [true, 'Message is required'],
      trim    : true,
      maxlength: 500,
    },
    type: {
      type   : String,
      enum   : ['warning', 'critical', 'info', 'success'],
      default: 'info',
    },
    priority: {
      type   : String,
      enum   : ['high', 'medium', 'low'],
      default: 'medium',
    },
    read: {
      type   : Boolean,
      default: false,
    },
    timestamp: {
      type   : Date,
      default: Date.now,
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

// Compound index for efficient unread-first queries
notificationSchema.index({ owner: 1, read: 1, timestamp: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
