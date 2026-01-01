require('dotenv').config();
const connectDB = require('../config/database');
const { User } = require('../models');
const logger = require('./logger');

const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@visitorcontrol.com' });
    
    if (existing) {
      logger.info('Admin user already exists!');
      logger.info(`Email: ${existing.email}`);
      logger.info(`Password: admin123 (if not changed)`);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      fullName: 'System Administrator',
      email: 'admin@visitorcontrol.com',
      phone: '08000000000',
      password: 'admin123',
      role: 'admin',
      isActive: true,
      isVerified: true,
    });

    logger.info('✅ Admin user created successfully!\n');
    logger.info('Admin Credentials:');
    logger.info(`  Email: ${admin.email}`);
    logger.info(`  Password: admin123`);
    logger.info(`  Role: ${admin.role}\n`);
    logger.info('🔑 Use these credentials to login as admin');
    logger.info('⚠️  IMPORTANT: Change the password after first login!\n');

    process.exit(0);
  } catch (error) {
    logger.error(`Seed admin error: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();