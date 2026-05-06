const { db } = require('../config/firebase');
const MockQuery = require('../utils/rtdb-query');


/**
 * Mongoose-like wrapper for Firebase Realtime Database 'notifications'
 */
class NotificationModel {
  constructor() {
    this.ref = db.ref('notifications');
  }

  find(query = {}) {
    return new MockQuery(async () => {
      const key = Object.keys(query)[0];
      let snapshot;
      if (key) {
        snapshot = await this.ref.orderByChild(key).equalTo(query[key]).once('value');
      } else {
        snapshot = await this.ref.once('value');
      }

      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.keys(data)
        .map(id => this._mapNotification(id, data[id]))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    });
  }


  async create(data) {
    const newNotif = {
      ...data,
      read: false,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newRef = this.ref.push();
    await newRef.set(newNotif);
    return this._mapNotification(newRef.key, newNotif);
  }

  async findByIdAndUpdate(id, updates, options = {}) {
    const nRef = this.ref.child(id);
    await nRef.update({ ...updates, updatedAt: new Date().toISOString() });
    if (options.new) {
      const snapshot = await nRef.once('value');
      return this._mapNotification(id, snapshot.val());
    }
    return true;
  }

  async updateMany(query, updates) {
    const key = Object.keys(query)[0];
    const snapshot = await this.ref.orderByChild(key).equalTo(query[key]).once('value');
    if (!snapshot.exists()) return { nModified: 0 };
    
    const data = snapshot.val();
    const batchUpdates = {};
    Object.keys(data).forEach(id => {
      batchUpdates[`${id}`] = { ...data[id], ...updates, updatedAt: new Date().toISOString() };
    });
    await this.ref.update(batchUpdates);
    return { nModified: Object.keys(data).length };
  }

  async deleteMany(query = {}) {
    await this.ref.remove();
    return { deletedCount: 'all' };
  }

  _mapNotification(id, data) {
    return {
      ...data,
      _id: id,
      id: id,
      toJSON: () => ({ id, ...data })
    };
  }
}

module.exports = new NotificationModel();
