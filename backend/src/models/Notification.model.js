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
        .map(id => this._mapNotification(id, data[id]));
    });
  }

  findOne(query) {
    return new MockQuery(async () => {
      const key = Object.keys(query)[0];
      const snapshot = await this.ref.orderByChild(key).equalTo(query[key]).limitToFirst(1).once('value');
      if (!snapshot.exists()) return null;
      const data = snapshot.val();
      const id = Object.keys(data)[0];
      return this._mapNotification(id, data[id]);
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

  async findOneAndUpdate(query, updates, options = {}) {
    const notif = await this.findOne(query);
    if (!notif) return null;
    return this.findByIdAndUpdate(notif._id, updates, options);
  }

  async findOneAndDelete(query) {
    const notif = await this.findOne(query);
    if (!notif) return null;
    await this.ref.child(notif._id).remove();
    return notif;
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
    if (!snapshot.exists()) return { nModified: 0, modifiedCount: 0 };
    
    const data = snapshot.val();
    const batchUpdates = {};
    let count = 0;

    Object.keys(data).forEach(id => {
      // Manual secondary filtering for other query keys (e.g., { read: false })
      let matches = true;
      Object.keys(query).forEach(qKey => {
        if (data[id][qKey] !== query[qKey]) matches = false;
      });

      if (matches) {
        batchUpdates[`${id}`] = { ...data[id], ...updates, updatedAt: new Date().toISOString() };
        count++;
      }
    });

    if (count > 0) await this.ref.update(batchUpdates);
    return { nModified: count, modifiedCount: count };
  }

  async deleteMany(query = {}) {
    if (Object.keys(query).length === 0) {
      await this.ref.remove();
      return { deletedCount: 'all' };
    }

    const key = Object.keys(query)[0];
    const snapshot = await this.ref.orderByChild(key).equalTo(query[key]).once('value');
    if (!snapshot.exists()) return { deletedCount: 0 };

    const data = snapshot.val();
    const batchDeletes = {};
    let count = 0;

    Object.keys(data).forEach(id => {
      let matches = true;
      Object.keys(query).forEach(qKey => {
        if (data[id][qKey] !== query[qKey]) matches = false;
      });

      if (matches) {
        batchDeletes[`${id}`] = null;
        count++;
      }
    });

    if (count > 0) await this.ref.update(batchDeletes);
    return { deletedCount: count };
  }

  async insertMany(docs) {
    const updates = {};
    const results = [];
    docs.forEach(doc => {
      const newKey = this.ref.push().key;
      const data = { 
        ...doc, 
        read: false,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };
      updates[newKey] = data;
      results.push(this._mapNotification(newKey, data));
    });
    await this.ref.update(updates);
    return results;
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
