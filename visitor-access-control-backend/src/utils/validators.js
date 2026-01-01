/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (supports various formats)
 * @param {string} phone
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 * @param {string} password
 * @returns {object} { isValid, errors }
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters');
  }
  
  // Optional: Add more complexity requirements
  // if (!/[A-Z]/.test(password)) {
  //   errors.push('Password must contain at least one uppercase letter');
  // }
  
  // if (!/[a-z]/.test(password)) {
  //   errors.push('Password must contain at least one lowercase letter');
  // }
  
  // if (!/[0-9]/.test(password)) {
  //   errors.push('Password must contain at least one number');
  // }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate estate code format
 * @param {string} code
 * @returns {boolean}
 */
const isValidEstateCode = (code) => {
  // Format: EST-XXXXX (at least 5 characters after prefix)
  const estateCodeRegex = /^EST-[A-Z0-9]{5,}$/i;
  return estateCodeRegex.test(code);
};

/**
 * Validate username format
 * @param {string} username
 * @returns {boolean}
 */
const isValidUsername = (username) => {
  // Alphanumeric, 4-20 characters, can include underscore
  const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
  return usernameRegex.test(username);
};

/**
 * Validate date is in the future
 * @param {Date|string} date
 * @returns {boolean}
 */
const isFutureDate = (date) => {
  const inputDate = new Date(date);
  const now = new Date();
  return inputDate > now;
};

/**
 * Validate time format (HH:MM)
 * @param {string} time
 * @returns {boolean}
 */
const isValidTimeFormat = (time) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

/**
 * Sanitize string input (remove special characters)
 * @param {string} input
 * @returns {string}
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate MongoDB ObjectId
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

module.exports = {
  isValidEmail,
  isValidPhone,
  validatePassword,
  isValidEstateCode,
  isValidUsername,
  isFutureDate,
  isValidTimeFormat,
  sanitizeString,
  isValidObjectId,
};