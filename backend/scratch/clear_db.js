'use strict';
require('dotenv').config();
const { db } = require('../src/config/firebase');

async function clearDB() {
  console.log('🗑️  Clearing all data from Firebase Realtime Database...');
  
  try {
    await db.ref('users').remove();
    await db.ref('vehicles').remove();
    await db.ref('telemetry').remove();
    await db.ref('notifications').remove();
    await db.ref('predictions').remove();
    await db.ref('analytics').remove();
    
    console.log('✅ Database cleared successfully.');
  } catch (err) {
    console.error('❌ Failed to clear database:', err.message);
  }
  
  process.exit(0);
}

clearDB();
