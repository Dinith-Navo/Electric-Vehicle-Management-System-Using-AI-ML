const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ev-management-e8343-default-rtdb.firebaseio.com/"
});

async function testAuth() {
  try {
    console.log('Testing authentication...');
    const db = admin.database();
    // Try to read a dummy path
    await db.ref('.info/connected').once('value');
    console.log('✅ Authentication SUCCESSFUL!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Authentication FAILED!');
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    if (err.stack) console.error('Stack:', err.stack);
    process.exit(1);
  }
}

testAuth();
