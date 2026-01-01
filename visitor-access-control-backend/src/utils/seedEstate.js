require('dotenv').config();
const connectDB = require('../config/database');
const { Estate } = require('../models');
const bcrypt = require('bcryptjs');
const logger = require('./logger');

const seedEstate = async () => {
  try {
    await connectDB();

    // Check if estate already exists
    const existing = await Estate.findOne({ estateCode: 'EST-TEST1' });
    
    if (existing) {
      logger.info('Test estate already exists!');
      logger.info(`Estate Code: ${existing.estateCode}`);
      logger.info(`Username: ${existing.username}`);
      logger.info(`Password: password123`);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test estate
    const estate = await Estate.create({
      estateName: 'Oakwood Gardens Estate',
      estateCode: 'EST-TEST1',
      username: 'oakwood123',
      password: hashedPassword,
      address: '123 Oakwood Drive, Lekki, Lagos',
      contactEmail: 'admin@oakwoodgardens.com',
      contactPhone: '08012345678',
      isActive: true,
      createdBy: '507f1f77bcf86cd799439011', // Dummy admin ID
    });

    logger.info('✅ Test estate created successfully!\n');
    logger.info('Estate Details:');
    logger.info(`  Name: ${estate.estateName}`);
    logger.info(`  Estate Code: ${estate.estateCode}`);
    logger.info(`  Username: ${estate.username}`);
    logger.info(`  Password: password123`);
    logger.info(`  Contact: ${estate.contactEmail}\n`);
    logger.info('🔑 Use these credentials to:');
    logger.info('  1. Register residents (use EST-TEST1 as estate code)');
    logger.info('  2. Login as security (use EST-TEST1 or oakwood123 as identifier)\n');

    process.exit(0);
  } catch (error) {
    logger.error(`Seed error: ${error.message}`);
    process.exit(1);
  }
};

seedEstate();