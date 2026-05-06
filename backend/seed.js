'use strict';
require('dotenv').config();
const User = require('./src/models/User.model');
const Vehicle = require('./src/models/Vehicle.model');
const Telemetry = require('./src/models/Telemetry.model');
const Notification = require('./src/models/Notification.model');
const logger = require('./src/utils/logger');

const seedData = async () => {
  try {
    logger.info('Starting Firebase seeding...');


    // Clear existing data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Telemetry.deleteMany({});
    await Notification.deleteMany({});

    // Create a demo user
    const user = await User.create({
      name: 'Demo Driver',
      email: 'demo@example.com',
      password: 'password123',
      role: 'EV Owner',
    });
    logger.info('User created: demo@example.com / password123');

    // Create a demo vehicle
    const vehicle = await Vehicle.create({
      owner: user._id,
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      vin: 'TSLA1234567890',
      batteryCapacity: 75,
      color: 'Midnight Silver',
      licensePlate: 'EV-GO-AI',
      category: 'Sedan',
    });
    logger.info('Vehicle created: Tesla Model 3');

    // Create some historical telemetry
    const history = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      history.push({
        owner: user._id,
        vehicle: vehicle._id,
        soc: 80 - i * 2,
        soh: 98 - i * 0.1,
        voltage: 380 + Math.random() * 10,
        temperature: 25 + Math.random() * 5,
        createdAt: date,
      });
    }
    await Telemetry.insertMany(history);
    logger.info('Historical telemetry seeded.');

    // Create some notifications
    await Notification.create([
      {
        owner: user._id,
        vehicle: vehicle._id,
        title: 'Welcome to EV Management',
        message: 'Your vehicle is now connected and being monitored by AI.',
        type: 'success',
        priority: 'low',
      },
      {
        owner: user._id,
        vehicle: vehicle._id,
        title: 'Charging Optimization',
        message: 'Your current charging pattern is optimal for battery health.',
        type: 'info',
        priority: 'medium',
      }
    ]);
    logger.info('Sample notifications seeded.');

    logger.info('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    logger.error(`Seeding failed: ${err.message}`);
    process.exit(1);
  }
};

seedData();
