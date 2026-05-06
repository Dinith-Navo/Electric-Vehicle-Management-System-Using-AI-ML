'use strict';
const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const MockQuery = require('../utils/rtdb-query');


/**
 * Mongoose-like wrapper for Firebase Realtime Database 'users'
 */
class UserModel {
  constructor() {
    this.ref = db.ref('users');
  }

  findById(id) {
    return new MockQuery(async () => {
      const snapshot = await this.ref.child(id).once('value');
      if (!snapshot.exists()) return null;
      return this._mapUser(id, snapshot.val());
    });
  }

  findOne(query) {
    return new MockQuery(async () => {
      const logger = require('../utils/logger');
      const key = Object.keys(query)[0];
      const value = query[key];
      
      logger.info(`[DB] Finding user by ${key}: ${value}`);
      const snapshot = await this.ref.orderByChild(key).equalTo(value).limitToFirst(1).once('value');
      
      if (!snapshot.exists()) {
        logger.info(`[DB] No user found with ${key}: ${value}`);
        return null;
      }
      
      const data = snapshot.val();
      const id = Object.keys(data)[0];
      logger.info(`[DB] User found: ${id}`);
      return this._mapUser(id, data[id]);
    });
  }


  async create(data) {
    const logger = require('../utils/logger');
    try {
      const newUser = {
        ...data,
        isActive: true,
        memberSince: new Date().getFullYear().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (newUser.password) {
        logger.info(`[DB] Hashing password...`);
        const salt = await bcrypt.genSalt(12);
        newUser.password = await bcrypt.hash(newUser.password, salt);
        logger.info(`[DB] Password hashed successfully`);
      }

      const newRef = this.ref.push();
      logger.info(`Attempting to save user to RTDB path: users/${newRef.key}`);
      await newRef.set(newUser);
      logger.info(`✅ User saved to RTDB successfully`);
      return this._mapUser(newRef.key, newUser);
    } catch (err) {
      logger.error(`❌ RTDB Set Error: ${err.message}`);
      logger.error(err.stack);
      throw err;
    }

  }


  async findOneAndUpdate(query, updates, options = {}) {
    const user = await this.findOne(query);
    if (!user) return null;
    return this.findByIdAndUpdate(user._id, updates, options);
  }

  async findByIdAndUpdate(id, updates, options = {}) {
    const userRef = this.ref.child(id);
    await userRef.update({ ...updates, updatedAt: new Date().toISOString() });
    if (options.new) {
      const snapshot = await userRef.once('value');
      return this._mapUser(id, snapshot.val());
    }
    return true;
  }

  async deleteMany(query = {}) {
    // RTDB doesn't support easy deleteMany by query.
    // For seeding, we usually just clear the whole ref.
    await this.ref.remove();
    return { deletedCount: 'all' };
  }

  _mapUser(id, data) {
    // Create the base user object from data
    const user = {
      ...data,
      _id: id,
      id: id,
    };

    // Add methods
    user.comparePassword = async (candidatePwd) => {
      // Use user.password which might be updated, or data.password
      return bcrypt.compare(candidatePwd, user.password || data.password);
    };

    user.save = async () => {
      const { id: _ignoredId, _id: _ignored_id, comparePassword, save, toJSON, ...saveData } = user;
      await this.ref.child(id).update({ 
        ...saveData, 
        updatedAt: new Date().toISOString() 
      });
      return true;
    };

    user.toJSON = () => {
      // Create a copy of the current user object
      const { password, refreshToken, comparePassword, save, toJSON, ...rest } = user;
      return rest;
    };

    return user;
  }
}

module.exports = new UserModel();
