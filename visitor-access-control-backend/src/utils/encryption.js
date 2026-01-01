const crypto = require('crypto');
const config = require('../config/env');

// Algorithm for encryption
const algorithm = 'aes-256-cbc';

// Ensure encryption key is 32 bytes
const getEncryptionKey = () => {
  const key = config.encryptionKey || 'default-key-change-this-in-prod';
  // Create a 32-byte key from the provided key
  return crypto.createHash('sha256').update(key).digest();
};

/**
 * Encrypt a string
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text in format: iv:encryptedData
 */
const encrypt = (text) => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16); // Initialization vector
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return IV and encrypted data separated by ':'
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

/**
 * Decrypt a string
 * @param {string} encryptedText - Text to decrypt in format: iv:encryptedData
 * @returns {string} - Decrypted text
 */
const decrypt = (encryptedText) => {
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

/**
 * Generate a random token
 * @param {number} length - Length of token in bytes (default: 32)
 * @returns {string} - Random hex token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a string using SHA256
 * @param {string} text - Text to hash
 * @returns {string} - Hashed text
 */
const hash = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

module.exports = {
  encrypt,
  decrypt,
  generateToken,
  hash,
};