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

    let serviceAccount;
    let source = '';

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      source = 'FIREBASE_SERVICE_ACCOUNT env var';
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const path = require('path');
      const fs = require('fs');
      const keyPath = path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS) 
        ? process.env.GOOGLE_APPLICATION_CREDENTIALS 
        : path.join(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
      
      if (fs.existsSync(keyPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        source = `file at ${keyPath}`;
      } else {
        throw new Error(`Service account file not found at ${keyPath}`);
      }
    }

    if (serviceAccount) {
      // Fix potential newline issues and trim (common causes of "Invalid JWT Signature")
      if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n').trim();
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL || "https://ev-management-e8343-default-rtdb.firebaseio.com/",
        projectId: serviceAccount.project_id
      });
      logger.info(`✅ Firebase Admin SDK initialized using ${source}`);
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_DATABASE_URL || "https://ev-management-e8343-default-rtdb.firebaseio.com/"
      });
      logger.info('✅ Firebase Admin SDK initialized using Application Default Credentials');
    }

    const db = admin.database();
    logger.info(`✅ Firebase Realtime Database connected to: ${process.env.FIREBASE_DATABASE_URL || "default"}`);
    
    return db;

  } catch (error) {
    logger.error(`❌ Firebase initialization failed: ${error.message}`);
    if (error.stack) logger.debug(error.stack);
    return null;
  }
};

const db = initializeFirebase();

module.exports = { admin, db };
