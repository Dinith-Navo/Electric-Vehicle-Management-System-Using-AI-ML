'use strict';

/**
 * A mock query object to provide Mongoose-like chaining for Firestore/RTDB results.
 * Since we are already fetching data, this mostly performs in-memory operations.
 */
class MockQuery {
  constructor(dataOrFn) {
    this.dataOrFn = dataOrFn;
  }

  async _exec() {
    let data = typeof this.dataOrFn === 'function' ? await this.dataOrFn() : this.dataOrFn;
    
    // Handle stubs like sort, limit, etc.
    if (Array.isArray(data)) {
      if (this._sortParams) {
        const key = Object.keys(this._sortParams)[0];
        const dir = this._sortParams[key];
        data.sort((a, b) => {
          if (a[key] < b[key]) return dir === -1 ? 1 : -1;
          if (a[key] > b[key]) return dir === -1 ? -1 : 1;
          return 0;
        });
      }
      if (this._limitVal) {
        data = data.slice(0, this._limitVal);
      }
    }
    return data;
  }

  then(onFulfilled, onRejected) {
    return this._exec().then(onFulfilled, onRejected);
  }

  sort(sortObj) {
    this._sortParams = sortObj;
    return this;
  }

  limit(n) {
    this._limitVal = n;
    return this;
  }

  select(fields) {
    return this;
  }

  populate(path) {
    return this;
  }

  lean() {
    return this;
  }
}

module.exports = MockQuery;
