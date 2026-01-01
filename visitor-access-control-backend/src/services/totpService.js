const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const { encrypt, decrypt } = require('../utils/encryption');
const { TOTP_ISSUER, TOTP_ALGORITHM, TOTP_DIGITS } = require('../config/constants');
const config = require('../config/env');
const logger = require('../utils/logger');

// Configure OTPLib with STRICT time window
authenticator.options = {
  step: 30,              // 30 seconds per code
  window: 0,             // ✅ STRICT: Only accept current time window (no tolerance)
  algorithm: TOTP_ALGORITHM || 'sha1',
  digits: TOTP_DIGITS || 6,
};

/**
 * Generate a new TOTP secret
 * @returns {string} Base32 encoded secret
 */
const generateSecret = () => {
  try {
    return authenticator.generateSecret();
  } catch (error) {
    logger.error(`TOTP secret generation error: ${error.message}`);
    throw new Error('Failed to generate TOTP secret');
  }
};

/**
 * Generate TOTP token from secret
 * @param {string} secret - TOTP secret (encrypted or plain)
 * @param {boolean} isEncrypted - Whether the secret is encrypted
 * @returns {string} 6-digit TOTP token
 */
const generateToken = (secret, isEncrypted = true) => {
  try {
    const plainSecret = isEncrypted ? decrypt(secret) : secret;
    return authenticator.generate(plainSecret);
  } catch (error) {
    logger.error(`TOTP token generation error: ${error.message}`);
    throw new Error('Failed to generate TOTP token');
  }
};

/**
 * Verify TOTP token with optional custom window
 * @param {string} token - 6-digit token to verify
 * @param {string} secret - TOTP secret (encrypted)
 * @param {number} customWindow - Optional: Override default window (0 = strict)
 * @returns {boolean} True if valid, false otherwise
 */
const verifyToken = (token, secret, customWindow = null) => {
  try {
    const plainSecret = decrypt(secret);
    
    // Use custom window if provided, otherwise use default (0)
    if (customWindow !== null) {
      return authenticator.verify({ 
        token, 
        secret: plainSecret,
        window: customWindow
      });
    }
    
    return authenticator.verify({ token, secret: plainSecret });
  } catch (error) {
    logger.error(`TOTP verification error: ${error.message}`);
    return false;
  }
};

/**
 * Generate QR code for TOTP setup
 * @param {string} secret - TOTP secret (plain, not encrypted)
 * @param {string} accountName - User's account name (email or phone)
 * @param {string} issuer - Issuer name (estate name)
 * @returns {Promise<string>} Base64 encoded QR code image
 */
const generateQRCode = async (secret, accountName, issuer = TOTP_ISSUER) => {
  try {
    const otpauthUrl = authenticator.keyuri(
      accountName,
      issuer,
      secret
    );
    
    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    logger.error(`QR code generation error: ${error.message}`);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate TOTP setup data for a trusted contact
 * @param {string} contactName - Name of trusted contact
 * @param {string} contactPhone - Phone number of contact
 * @param {string} estateName - Name of estate
 * @returns {Promise<object>} Setup data with secret and QR code
 */
const generateTOTPSetup = async (contactName, contactPhone, estateName) => {
  try {
    // Generate new secret
    const secret = generateSecret();
    
    // Encrypt secret for storage
    const encryptedSecret = encrypt(secret);
    
    // Generate QR code
    const accountName = `${contactName} (${contactPhone})`;
    const issuer = `${TOTP_ISSUER} - ${estateName}`;
    const qrCode = await generateQRCode(secret, accountName, issuer);
    
    return {
      secret: encryptedSecret,
      plainSecret: secret, // For initial setup only, don't store this
      qrCode,
      setupInstructions: {
        step1: 'Download Google Authenticator or any TOTP app',
        step2: 'Scan the QR code below',
        step3: 'Or manually enter the secret key',
        step4: 'Use the 6-digit code from the app to enter the estate',
        note: 'Code refreshes every 30 seconds and expires immediately after',
      },
    };
  } catch (error) {
    logger.error(`TOTP setup generation error: ${error.message}`);
    throw new Error('Failed to generate TOTP setup');
  }
};

/**
 * Check if TOTP token is valid and not expired
 * @param {string} token - 6-digit token
 * @param {string} encryptedSecret - Encrypted TOTP secret
 * @param {boolean} strictMode - If true, use window 0 (strict 30s), if false use window 1 (90s tolerance)
 * @returns {object} { isValid, message, timeRemaining }
 */
const validateTOTP = (token, encryptedSecret, strictMode = true) => {
  try {
    // Check token format
    if (!token || !/^\d{6}$/.test(token)) {
      return {
        isValid: false,
        message: 'Invalid token format. Must be 6 digits.',
      };
    }

    // Verify token with appropriate window
    // strictMode = true: window 0 (only current 30s)
    // strictMode = false: window 1 (90s tolerance for network delays)
    const window = strictMode ? 0 : 1;
    const isValid = verifyToken(token, encryptedSecret, window);

    if (isValid) {
      const timeRemaining = getTimeRemaining();
      
      return {
        isValid: true,
        message: 'Token verified successfully',
        timeRemaining,
        expiresIn: `${timeRemaining} seconds`,
      };
    } else {
      return {
        isValid: false,
        message: 'Invalid or expired token. Please generate a new code.',
      };
    }
  } catch (error) {
    logger.error(`TOTP validation error: ${error.message}`);
    return {
      isValid: false,
      message: 'Token verification failed',
    };
  }
};

/**
 * Get remaining time until current token expires
 * @returns {number} Remaining seconds
 */
const getTimeRemaining = () => {
  const step = 30; // Fixed to 30 seconds
  const currentTime = Math.floor(Date.now() / 1000);
  const timeInStep = currentTime % step;
  return step - timeInStep;
};

/**
 * Check if a token was recently used (to prevent replay attacks)
 * @param {string} token - TOTP token
 * @param {Array} recentTokens - Array of recently used tokens with timestamps
 * @returns {boolean} True if token was recently used
 */
const isTokenRecentlyUsed = (token, recentTokens = []) => {
  const currentTime = Date.now();
  const validityWindow = 60000; // 60 seconds
  
  return recentTokens.some(used => 
    used.token === token && 
    (currentTime - used.timestamp) < validityWindow
  );
};

module.exports = {
  generateSecret,
  generateToken,
  verifyToken,
  generateQRCode,
  generateTOTPSetup,
  validateTOTP,
  getTimeRemaining,
  isTokenRecentlyUsed,
};