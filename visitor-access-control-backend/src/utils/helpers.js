const { HTTP_STATUS } = require('../config/constants');

/**
 * Create a standardized API response
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} success - Success flag
 * @param {string} message - Response message
 * @param {object} data - Response data
 */
const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Create a success response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {object} data - Response data
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, message, data = null, statusCode = HTTP_STATUS.OK) => {
  return sendResponse(res, statusCode, true, message, data);
};

/**
 * Create an error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {object} errors - Validation errors
 */
const sendError = (res, message, statusCode = HTTP_STATUS.BAD_REQUEST, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Create a custom error object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Paginate results
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} { skip, limit }
 */
const getPagination = (page = 1, limit = 20) => {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  const skip = (pageNum - 1) * limitNum;

  return {
    skip: skip >= 0 ? skip : 0,
    limit: limitNum > 0 && limitNum <= 100 ? limitNum : 20,
  };
};

/**
 * Format pagination metadata
 * @param {number} totalItems - Total number of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination metadata
 */
const getPaginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    totalItems,
    currentPage: parseInt(page, 10),
    totalPages,
    itemsPerPage: parseInt(limit, 10),
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Remove sensitive fields from object
 * @param {object} obj - Object to clean
 * @param {array} fields - Fields to remove
 * @returns {object} Cleaned object
 */
const removeSensitiveFields = (obj, fields = ['password', 'totpSecret', 'resetPasswordToken']) => {
  const cleaned = { ...obj };
  fields.forEach(field => delete cleaned[field]);
  return cleaned;
};

/**
 * Generate a random code
 * @param {string} prefix - Code prefix
 * @param {number} length - Length of random part
 * @returns {string} Generated code
 */
const generateCode = (prefix, length = 5) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${prefix}-${code}`;
};

/**
 * Format date to Nigerian timezone
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate time difference in minutes
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {number} Difference in minutes
 */
const getTimeDifferenceInMinutes = (startDate, endDate) => {
  const diff = endDate - startDate;
  return Math.floor(diff / 1000 / 60);
};

/**
 * Check if date is today
 * @param {Date} date
 * @returns {boolean}
 */
const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

module.exports = {
  sendResponse,
  sendSuccess,
  sendError,
  AppError,
  getPagination,
  getPaginationMeta,
  removeSensitiveFields,
  generateCode,
  formatDate,
  getTimeDifferenceInMinutes,
  isToday,
};