'use strict';
require('dotenv').config();
const { db } = require('../src/config/firebase');

async function deleteUser() {
  const email = 'dinithnavodya12@gmail.com';
  console.log(`Searching for user with email: ${email}`);
  
  const ref = db.ref('users');
  const snapshot = await ref.orderByChild('email').equalTo(email).once('value');
  
  if (snapshot.exists()) {
    const data = snapshot.val();
    const id = Object.keys(data)[0];
    console.log(`Deleting user: ${id}`);
    await ref.child(id).remove();
    console.log('User deleted successfully.');
  } else {
    console.log('User not found.');
  }
  process.exit(0);
}

deleteUser();
