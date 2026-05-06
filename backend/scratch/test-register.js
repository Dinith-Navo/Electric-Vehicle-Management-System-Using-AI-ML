'use strict';
require('dotenv').config();
const User = require('../src/models/User.model');
const logger = require('../src/utils/logger');

const testRegister = async () => {
  try {
    console.log('--- Testing User Registration ---');
    const email = `test_${Date.now()}@example.com`;
    const name = 'Test User';
    const password = 'password123';

    console.log(`Checking if ${email} exists...`);
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('User already exists!');
      return;
    }

    console.log('Creating user...');
    const user = await User.create({ name, email, password });
    console.log('✅ User created:', user.id);

    console.log('Testing save method...');
    user.lastLogin = new Date();
    await user.save();
    console.log('✅ User saved successfully');

    console.log('Test completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
};

testRegister();
