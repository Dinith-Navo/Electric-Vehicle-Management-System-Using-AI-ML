'use strict';
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type     : String,
      required : [true, 'Name is required'],
      trim     : true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type     : String,
      required : [true, 'Email is required'],
      unique   : true,
      lowercase: true,
      trim     : true,
      match    : [/^\S+@\S+\.\S+$/, 'Invalid email address'],
      index    : true,
    },
    password: {
      type     : String,
      required : [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select   : false,
    },
    phone: {
      type   : String,
      default: '',
      trim   : true,
    },
    avatar: {
      type   : String,
      default: '',
    },
    role: {
      type   : String,
      enum   : ['EV Owner', 'Fleet Manager', 'Service Provider', 'Admin'],
      default: 'EV Owner',
    },
    memberSince: {
      type   : String,
      default: () => new Date().getFullYear().toString(),
    },
    isActive: {
      type   : Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type  : String,
      select: false,
    },
    // Push notification token (for future FCM integration)
    pushToken: {
      type  : String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals : true,
      transform(_, ret) {
        ret.id = ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.refreshToken;
        delete ret.pushToken;
        return ret;
      },
    },
  }
);

// ─── Hash password before save ────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance method: compare passwords ──────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePwd) {
  return bcrypt.compare(candidatePwd, this.password);
};

// ─── Static: find active user by email ───────────────────────────────────────
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim(), isActive: true });
};

module.exports = mongoose.model('User', userSchema);
