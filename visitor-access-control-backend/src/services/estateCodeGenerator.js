const { Estate } = require('../models');
const { ESTATE_CODE_PREFIX, ESTATE_CODE_LENGTH } = require('../config/constants');
const { generateCode } = require('../utils/helpers');

/**
 * Generate a unique estate code
 * @returns {Promise<string>} Unique estate code
 */
const generateUniqueEstateCode = async () => {
  let isUnique = false;
  let estateCode;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate a random code
    const randomLength = ESTATE_CODE_LENGTH - ESTATE_CODE_PREFIX.length - 1; // -1 for the hyphen
    estateCode = generateCode(ESTATE_CODE_PREFIX, randomLength);

    // Check if code already exists
    const existingEstate = await Estate.findOne({ estateCode });
    
    if (!existingEstate) {
      isUnique = true;
    }
    
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique estate code. Please try again.');
  }

  return estateCode;
};

/**
 * Check if estate code is available
 * @param {string} code - Estate code to check
 * @returns {Promise<boolean>} True if available, false otherwise
 */
const isEstateCodeAvailable = async (code) => {
  const existingEstate = await Estate.findOne({ estateCode: code.toUpperCase() });
  return !existingEstate;
};

/**
 * Check if estate username is available
 * @param {string} username - Username to check
 * @returns {Promise<boolean>} True if available, false otherwise
 */
const isEstateUsernameAvailable = async (username) => {
  const existingEstate = await Estate.findOne({ username: username.toLowerCase() });
  return !existingEstate;
};

module.exports = {
  generateUniqueEstateCode,
  isEstateCodeAvailable,
  isEstateUsernameAvailable,
};