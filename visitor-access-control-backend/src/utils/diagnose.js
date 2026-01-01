console.log('🔍 Diagnosing application...\n');

// Check 1: Environment variables
console.log('1️⃣ Checking environment variables...');
require('dotenv').config();
try {
  const config = require('../config/env');
  console.log('   ✅ Environment variables loaded');
  console.log(`   - Node ENV: ${config.nodeEnv}`);
  console.log(`   - Port: ${config.port}`);
  console.log(`   - MongoDB URI: ${config.mongodbUri ? '✅ Set' : '❌ Missing'}`);
  console.log(`   - JWT Secret: ${config.jwtSecret ? '✅ Set' : '❌ Missing'}`);
} catch (error) {
  console.log('   ❌ Error loading config:', error.message);
  process.exit(1);
}

// Check 2: Logger
console.log('\n2️⃣ Checking logger...');
try {
  const logger = require('./logger');
  console.log('   ✅ Logger loaded');
} catch (error) {
  console.log('   ❌ Error loading logger:', error.message);
  process.exit(1);
}

// Check 3: Models
console.log('\n3️⃣ Checking models...');
try {
  const models = require('../models');
  console.log('   ✅ Models loaded');
  console.log(`   - Estate: ${models.Estate ? '✅' : '❌'}`);
  console.log(`   - User: ${models.User ? '✅' : '❌'}`);
  console.log(`   - TrustedContact: ${models.TrustedContact ? '✅' : '❌'}`);
  console.log(`   - PreRegisteredVisitor: ${models.PreRegisteredVisitor ? '✅' : '❌'}`);
  console.log(`   - VisitorLog: ${models.VisitorLog ? '✅' : '❌'}`);
  console.log(`   - Notification: ${models.Notification ? '✅' : '❌'}`);
} catch (error) {
  console.log('   ❌ Error loading models:', error.message);
  console.log('   Stack:', error.stack);
  process.exit(1);
}

// Check 4: Services
console.log('\n4️⃣ Checking services...');
try {
  const jwtService = require('../services/jwtService');
  const estateCodeGenerator = require('../services/estateCodeGenerator');
  console.log('   ✅ Services loaded');
} catch (error) {
  console.log('   ❌ Error loading services:', error.message);
  console.log('   Stack:', error.stack);
  process.exit(1);
}

// Check 5: Middleware
console.log('\n5️⃣ Checking middleware...');
try {
  const auth = require('../middleware/auth');
  const authorize = require('../middleware/authorize');
  const errorHandler = require('../middleware/errorHandler');
  const rateLimiter = require('../middleware/rateLimiter');
  const validate = require('../middleware/validateInput');
  console.log('   ✅ Middleware loaded');
} catch (error) {
  console.log('   ❌ Error loading middleware:', error.message);
  console.log('   Stack:', error.stack);
  process.exit(1);
}

// Check 6: Controllers
console.log('\n6️⃣ Checking controllers...');
try {
  const authController = require('../controllers/authController');
  console.log('   ✅ Controllers loaded');
} catch (error) {
  console.log('   ❌ Error loading controllers:', error.message);
  console.log('   Stack:', error.stack);
  process.exit(1);
}

// Check 7: Routes
console.log('\n7️⃣ Checking routes...');
try {
  const authRoutes = require('../routes/authRoutes');
  console.log('   ✅ Routes loaded');
} catch (error) {
  console.log('   ❌ Error loading routes:', error.message);
  console.log('   Stack:', error.stack);
  process.exit(1);
}

// Check 8: Express App
console.log('\n8️⃣ Checking Express app...');
try {
  const app = require('../app');
  console.log('   ✅ Express app loaded');
} catch (error) {
  console.log('   ❌ Error loading app:', error.message);
  console.log('   Stack:', error.stack);
  process.exit(1);
}

console.log('\n✅ All components loaded successfully!');
console.log('📝 The server should be able to start now.\n');
process.exit(0);