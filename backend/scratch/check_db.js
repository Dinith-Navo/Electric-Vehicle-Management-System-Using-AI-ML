'use strict';
require('dotenv').config();
const { db } = require('../src/config/firebase');

async function checkDB() {
  console.log('🔍 Checking Firebase Realtime Database content...');
  try {
    const snapshot = await db.ref().once('value');
    if (snapshot.exists()) {
      console.log('✅ Data found in database:');
      console.log(JSON.stringify(snapshot.val(), null, 2));
    } else {
      console.log('⚠️  Database is completely EMPTY.');
    }
  } catch (err) {
    console.error('❌ Error reading database:', err.message);
  }
  process.exit(0);
}

checkDB();
