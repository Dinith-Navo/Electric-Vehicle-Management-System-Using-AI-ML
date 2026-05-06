'use strict';
const admin = require('firebase-admin');
const logger = require('../utils/logger');

/**
 * Initializes Firebase Admin SDK.
 * It looks for a JSON string in process.env.FIREBASE_SERVICE_ACCOUNT
 * or a file path in process.env.GOOGLE_APPLICATION_CREDENTIALS.
 */
const initializeFirebase = () => {
  try {
    if (admin.apps.length > 0) return admin.database();

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://ev-management-e8343-default-rtdb.firebaseio.com/"
      });
    } else {
      // In development, you can use GOOGLE_APPLICATION_CREDENTIALS path
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: "https://ev-management-e8343-default-rtdb.firebaseio.com/"
      });
    }

    logger.info('✅ Firebase Admin SDK initialized (RTDB)');
    const db = admin.database();
    
    return db;

  } catch (error) {
    logger.error(`❌ Firebase initialization failed: ${error.message}`);
    // We don't exit process, we'll handle db == null in services/controllers
    return null;
  }
};

const db = initializeFirebase();

module.exports = { admin, db };
