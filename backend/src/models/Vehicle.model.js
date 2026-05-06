const { db } = require('../config/firebase');
const MockQuery = require('../utils/rtdb-query');


/**
 * Mongoose-like wrapper for Firebase Realtime Database 'vehicles'
 */
class VehicleModel {
  constructor() {
    this.ref = db.ref('vehicles');
  }

  find(query = {}) {
    return new MockQuery(async () => {
      let snapshot;
      const key = Object.keys(query)[0];
      if (key) {
        snapshot = await this.ref.orderByChild(key).equalTo(query[key]).once('value');
      } else {
        snapshot = await this.ref.once('value');
      }
      
      if (!snapshot.exists()) return [];
      const data = snapshot.val();
      return Object.keys(data).map(id => this._mapVehicle(id, data[id]));
    });
  }

  findById(id) {
    return new MockQuery(async () => {
      const snapshot = await this.ref.child(id).once('value');
      if (!snapshot.exists()) return null;
      return this._mapVehicle(id, snapshot.val());
    });
  }

  findOne(query) {
    return new MockQuery(async () => {
      const key = Object.keys(query)[0];
      const snapshot = await this.ref.orderByChild(key).equalTo(query[key]).limitToFirst(1).once('value');
      if (!snapshot.exists()) return null;
      const data = snapshot.val();
      const id = Object.keys(data)[0];
      return this._mapVehicle(id, data[id]);
    });
  }


  async create(data) {
    const sanitizedData = { ...data };
    // Remove undefined fields which Firebase doesn't allow
    Object.keys(sanitizedData).forEach(key => sanitizedData[key] === undefined && delete sanitizedData[key]);
    
    const newVehicle = {
      category: 'Electric', // Default category
      ...sanitizedData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newRef = this.ref.push();
    await newRef.set(newVehicle);
    return this._mapVehicle(newRef.key, newVehicle);
  }

  async findOneAndUpdate(query, updates, options = {}) {
    const vehicle = await this.findOne(query);
    if (!vehicle) return null;
    return this.findByIdAndUpdate(vehicle._id, updates, options);
  }

  async findByIdAndUpdate(id, updates, options = {}) {
    const vRef = this.ref.child(id);
    await vRef.update({ ...updates, updatedAt: new Date().toISOString() });
    if (options.new) {
      const snapshot = await vRef.once('value');
      return this._mapVehicle(id, snapshot.val());
    }
    return true;
  }

  async findByIdAndDelete(id) {
    await this.ref.child(id).remove();
    return true;
  }

  async deleteMany(query = {}) {
    await this.ref.remove();
    return { deletedCount: 'all' };
  }

  _mapVehicle(id, data) {
    return {
      ...data,
      _id: id,
      id: id,
      toJSON: () => ({ id, ...data })
    };
  }
}

module.exports = new VehicleModel();
