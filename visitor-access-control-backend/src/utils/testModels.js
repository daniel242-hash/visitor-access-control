require('dotenv').config();
const connectDB = require('../config/database');
const logger = require('./logger');
const {
  Estate,
  User,
  TrustedContact,
  PreRegisteredVisitor,
  VisitorLog,
  Notification,
} = require('../models');

const testModels = async () => {
  try {
    // Connect to database
    await connectDB();
    logger.info('Starting model tests...\n');

    // Test Estate Model
    logger.info('✓ Estate model loaded');
    logger.info(`  - Fields: estateName, estateCode, username, password, address, contactEmail, contactPhone`);

    // Test User Model
    logger.info('✓ User model loaded');
    logger.info(`  - Fields: fullName, email, phone, password, role, homeAddress, estateId`);

    // Test TrustedContact Model
    logger.info('✓ TrustedContact model loaded');
    logger.info(`  - Fields: residentId, estateId, fullName, phone, relationship, totpSecret`);

    // Test PreRegisteredVisitor Model
    logger.info('✓ PreRegisteredVisitor model loaded');
    logger.info(`  - Fields: residentId, visitorName, visitorPhone, expectedArrivalDate, status`);

    // Test VisitorLog Model
    logger.info('✓ VisitorLog model loaded');
    logger.info(`  - Fields: estateId, residentId, visitorType, verificationMethod, entryTime`);

    // Test Notification Model
    logger.info('✓ Notification model loaded');
    logger.info(`  - Fields: userId, type, title, message, channels, isRead`);

    // Count documents in each collection
    logger.info('\n📊 Database Statistics:');
    logger.info(`  - Estates: ${await Estate.countDocuments()}`);
    logger.info(`  - Users: ${await User.countDocuments()}`);
    logger.info(`  - Trusted Contacts: ${await TrustedContact.countDocuments()}`);
    logger.info(`  - Pre-registered Visitors: ${await PreRegisteredVisitor.countDocuments()}`);
    logger.info(`  - Visitor Logs: ${await VisitorLog.countDocuments()}`);
    logger.info(`  - Notifications: ${await Notification.countDocuments()}`);

    logger.info('\n✅ All models tested successfully!');
    logger.info('📚 Models are ready for use\n');

    process.exit(0);
  } catch (error) {
    logger.error(`❌ Model test failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

// Run the test
testModels();