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
    if (typeof this.dataOrFn === 'function') {
      return await this.dataOrFn();
    }
    return this.dataOrFn;
  }

  then(onFulfilled, onRejected) {
    return this._exec().then(onFulfilled, onRejected);
  }

  sort(sortObj) {
    // Note: sorting is already handled in some RTDB queries, 
    // but for find() we might want in-memory sort
    return this;
  }

  limit(n) {
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
