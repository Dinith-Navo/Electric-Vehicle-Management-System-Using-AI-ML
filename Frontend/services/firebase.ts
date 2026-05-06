import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// Firebase configuration using the provided Realtime Database URL.
// IMPORTANT: Please update the remaining fields from your Firebase Console.
const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "ev-management-e8343.firebaseapp.com",
  databaseURL: "https://ev-management-e8343-default-rtdb.firebaseio.com/",
  projectId: "ev-management-e8343",
  storageBucket: "ev-management-e8343.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const rtdb = getDatabase(app);
export default app;
