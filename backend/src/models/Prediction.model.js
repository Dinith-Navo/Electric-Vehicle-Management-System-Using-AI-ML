const { db } = require('../config/firebase');
const MockQuery = require('../utils/rtdb-query');


/**
 * Mongoose-like wrapper for Firebase Realtime Database 'predictions'
 */
class PredictionModel {
  constructor() {
    this.ref = db.ref('predictions');
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
        .map(id => this._mapPrediction(id, data[id]))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
  }

  findOne(query) {
    return new MockQuery(async () => {
      const key = Object.keys(query)[0];
      const snapshot = await this.ref.orderByChild(key).equalTo(query[key]).limitToLast(1).once('value');
      if (!snapshot.exists()) return null;
      const data = snapshot.val();
      const id = Object.keys(data)[0];
      return this._mapPrediction(id, data[id]);
    });
  }


  async create(data) {
    const newPred = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newRef = this.ref.push();
    await newRef.set(newPred);
    return this._mapPrediction(newRef.key, newPred);
  }

  _mapPrediction(id, data) {
    return {
      ...data,
      _id: id,
      id: id,
      toJSON: () => ({ id, ...data })
    };
  }
}

module.exports = new PredictionModel();
