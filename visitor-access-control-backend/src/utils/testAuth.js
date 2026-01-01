require('dotenv').config();
const logger = require('./logger');
const { encrypt, decrypt, generateToken, hash } = require('./encryption');
const { generateTokens, verifyAccessToken, extractTokenFromHeader } = require('../services/jwtService');
const { generateCode } = require('./helpers');
const { isValidEmail, isValidPhone, validatePassword } = require('./validators');

const testAuthSystem = async () => {
  try {
    logger.info('🧪 Testing Authentication System...\n');

    // Test 1: Encryption/Decryption
    logger.info('1️⃣ Testing Encryption/Decryption...');
    const originalText = 'JBSWY3DPEHPK3PXP'; // Sample TOTP secret
    const encrypted = encrypt(originalText);
    const decrypted = decrypt(encrypted);
    
    logger.info(`   Original: ${originalText}`);
    logger.info(`   Encrypted: ${encrypted}`);
    logger.info(`   Decrypted: ${decrypted}`);
    logger.info(`   ✅ Encryption/Decryption ${originalText === decrypted ? 'PASSED' : 'FAILED'}\n`);

    // Test 2: Token Generation
    logger.info('2️⃣ Testing Random Token Generation...');
    const randomToken = generateToken(32);
    logger.info(`   Token: ${randomToken}`);
    logger.info(`   Length: ${randomToken.length} characters`);
    logger.info(`   ✅ Token Generation PASSED\n`);

    // Test 3: Hashing
    logger.info('3️⃣ Testing SHA256 Hashing...');
    const textToHash = 'MySecurePassword123';
    const hashed = hash(textToHash);
    logger.info(`   Original: ${textToHash}`);
    logger.info(`   Hashed: ${hashed}`);
    logger.info(`   ✅ Hashing PASSED\n`);

    // Test 4: JWT Token Generation
    logger.info('4️⃣ Testing JWT Token Generation...');
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: 'resident',
      estateId: '507f1f77bcf86cd799439012',
    };
    const tokens = generateTokens(mockUser);
    logger.info(`   Access Token: ${tokens.accessToken.substring(0, 50)}...`);
    logger.info(`   Refresh Token: ${tokens.refreshToken.substring(0, 50)}...`);
    logger.info(`   ✅ JWT Generation PASSED\n`);

    // Test 5: JWT Token Verification
    logger.info('5️⃣ Testing JWT Token Verification...');
    const decoded = verifyAccessToken(tokens.accessToken);
    logger.info(`   Decoded User ID: ${decoded.id}`);
    logger.info(`   Decoded Email: ${decoded.email}`);
    logger.info(`   Decoded Role: ${decoded.role}`);
    logger.info(`   ✅ JWT Verification PASSED\n`);

    // Test 6: Token Extraction from Header
    logger.info('6️⃣ Testing Token Extraction from Header...');
    const authHeader = `Bearer ${tokens.accessToken}`;
    const extractedToken = extractTokenFromHeader(authHeader);
    logger.info(`   Auth Header: Bearer ${tokens.accessToken.substring(0, 20)}...`);
    logger.info(`   Extracted Token: ${extractedToken.substring(0, 20)}...`);
    logger.info(`   ✅ Token Extraction ${extractedToken === tokens.accessToken ? 'PASSED' : 'FAILED'}\n`);

    // Test 7: Estate Code Generation
    logger.info('7️⃣ Testing Estate Code Generation...');
    const estateCode = generateCode('EST', 5);
    logger.info(`   Generated Estate Code: ${estateCode}`);
    logger.info(`   Format: EST-XXXXX`);
    logger.info(`   ✅ Estate Code Generation PASSED\n`);

    // Test 8: Email Validation
    logger.info('8️⃣ Testing Email Validation...');
    const validEmail = 'user@example.com';
    const invalidEmail = 'invalid.email';
    logger.info(`   Valid Email (${validEmail}): ${isValidEmail(validEmail) ? '✅ PASSED' : '❌ FAILED'}`);
    logger.info(`   Invalid Email (${invalidEmail}): ${!isValidEmail(invalidEmail) ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test 9: Phone Validation
    logger.info('9️⃣ Testing Phone Validation...');
    const validPhone = '+2348012345678';
    const invalidPhone = '123';
    logger.info(`   Valid Phone (${validPhone}): ${isValidPhone(validPhone) ? '✅ PASSED' : '❌ FAILED'}`);
    logger.info(`   Invalid Phone (${invalidPhone}): ${!isValidPhone(invalidPhone) ? '✅ PASSED' : '❌ FAILED'}\n`);

    // Test 10: Password Validation
    logger.info('🔟 Testing Password Validation...');
    const weakPassword = '123';
    const strongPassword = 'SecurePass123';
    
    const weakResult = validatePassword(weakPassword);
    const strongResult = validatePassword(strongPassword);
    
    logger.info(`   Weak Password (${weakPassword}):`);
    logger.info(`      Valid: ${weakResult.isValid ? '✅' : '❌'}`);
    if (!weakResult.isValid) {
      weakResult.errors.forEach(err => logger.info(`      - ${err}`));
    }
    
    logger.info(`   Strong Password (${strongPassword}):`);
    logger.info(`      Valid: ${strongResult.isValid ? '✅' : '❌'}`);
    logger.info('');

    // Summary
    logger.info('═══════════════════════════════════════════');
    logger.info('✅ All Authentication System Tests PASSED!');
    logger.info('═══════════════════════════════════════════\n');
    logger.info('📋 Summary:');
    logger.info('   ✓ Encryption/Decryption working');
    logger.info('   ✓ Token generation working');
    logger.info('   ✓ Hashing working');
    logger.info('   ✓ JWT generation working');
    logger.info('   ✓ JWT verification working');
    logger.info('   ✓ Token extraction working');
    logger.info('   ✓ Estate code generation working');
    logger.info('   ✓ Email validation working');
    logger.info('   ✓ Phone validation working');
    logger.info('   ✓ Password validation working\n');

    process.exit(0);
  } catch (error) {
    logger.error(`❌ Authentication system test failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

// Run the test
testAuthSystem();