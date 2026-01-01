const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { AppError } = require('../utils/helpers');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Generate JWT access token
 * @param {object} payload - Token payload (user data)
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
  try {
    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpire,
    });
  } catch (error) {
    throw new AppError('Token generation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Generate JWT refresh token
 * @param {object} payload - Token payload (user data)
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  try {
    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpire,
    });
  } catch (error) {
    throw new AppError('Refresh token generation failed', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Generate both access and refresh tokens
 * @param {object} user - User object
 * @returns {object} { accessToken, refreshToken }
 */
const generateTokens = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
    role: user.role,
    estateId: user.estateId || user.assignedEstateId || null,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ id: user._id });

  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token has expired', HTTP_STATUS.UNAUTHORIZED);
    } else if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', HTTP_STATUS.UNAUTHORIZED);
    } else {
      throw new AppError('Token verification failed', HTTP_STATUS.UNAUTHORIZED);
    }
  }
};

/**
 * Verify JWT refresh token
 * @param {string} token - JWT refresh token
 * @returns {object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwtRefreshSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token has expired', HTTP_STATUS.UNAUTHORIZED);
    } else if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
    } else {
      throw new AppError('Refresh token verification failed', HTTP_STATUS.UNAUTHORIZED);
    }
  }
};

/**
 * Decode JWT token without verification (for debugging)
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  extractTokenFromHeader,
};