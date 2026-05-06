const { db } = require('../config/firebase');
const MockQuery = require('../utils/rtdb-query');


/**
 * Mongoose-like wrapper for Firebase Realtime Database 'telemetry'
 */
class TelemetryModel {
  constructor() {
    this.ref = db.ref('battery_logs');
  }

  find(query = {}) {
    return new MockQuery(async () => {
      let snapshot;
      
      if (query.owner) {
        snapshot = await this.ref.orderByChild('owner').equalTo(query.owner).once('value');
      } else if (query.vehicle) {
        snapshot = await this.ref.orderByChild('vehicle').equalTo(query.vehicle).once('value');
      } else {
        snapshot = await this.ref.once('value');
      }

      if (!snapshot.exists()) return [];
      
      const data = snapshot.val();
      let results = Object.keys(data).map(id => this._mapTelemetry(id, data[id]));
      
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return results;
    });
  }

  findOne(query) {
    return new MockQuery(async () => {
      const key = Object.keys(query)[0];
      const snapshot = await this.ref.orderByChild(key).equalTo(query[key]).limitToLast(1).once('value');
      if (!snapshot.exists()) return null;
      const data = snapshot.val();
      const id = Object.keys(data)[0];
      return this._mapTelemetry(id, data[id]);
    });
  }


  async create(data) {
    const newTelemetry = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newRef = this.ref.push();
    await newRef.set(newTelemetry);
    return this._mapTelemetry(newRef.key, newTelemetry);
  }

  async deleteMany(query = {}) {
    await this.ref.remove();
    return { deletedCount: 'all' };
  }

  async insertMany(docs) {
    const updates = {};
    const results = [];
    docs.forEach(doc => {
      const newKey = this.ref.push().key;
      const data = { ...doc, createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString() };
      updates[newKey] = data;
      results.push({ id: newKey, ...data });
    });
    await this.ref.update(updates);
    return results;
  }

  _mapTelemetry(id, data) {
    return {
      ...data,
      _id: id,
      id: id,
      toJSON: () => ({ id, ...data })
    };
  }
}

module.exports = new TelemetryModel();
