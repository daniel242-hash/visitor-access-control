const { User, Estate } = require('../models');
const { verifyAccessToken, extractTokenFromHeader } = require('../services/jwtService');
const { sendError, AppError } = require('../utils/helpers');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Middleware to protect routes - requires valid JWT token
 */
const protect = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return sendError(
        res,
        'No authentication token provided. Please log in.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // 2. Verify token
    const decoded = verifyAccessToken(token);

    // 3. Check if this is a security user by the isSecurity flag or role
    if (decoded.isSecurity === true || decoded.role === ROLES.SECURITY) {
      // Handle security personnel authentication
      const estate = await Estate.findById(decoded.id);

      if (!estate) {
        return sendError(
          res,
          'Estate no longer exists. Please log in again.',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      if (!estate.isActive) {
        return sendError(
          res,
          'This estate has been deactivated. Please contact support.',
          HTTP_STATUS.FORBIDDEN
        );
      }

      // Create a security user object
      req.user = {
        _id: estate._id,  // ✅ Use estate ObjectId directly
        email: estate.contactEmail,
        role: ROLES.SECURITY,
        estateId: estate._id,
        estate: {
          id: estate._id,
          name: estate.estateName,
          code: estate.estateCode,
        },
      };
      req.userId = estate._id;  // ✅ Use ObjectId
      req.userRole = ROLES.SECURITY;

      return next();
    }

    // 4. Regular user authentication (resident/admin)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return sendError(
        res,
        'User no longer exists. Please log in again.',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // 5. Check if user is active
    if (!user.isActive) {
      return sendError(
        res,
        'Your account has been deactivated. Please contact support.',
        HTTP_STATUS.FORBIDDEN
      );
    }

    // 6. Attach user to request object
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;

    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    
    return sendError(
      res,
      'Authentication failed. Please log in again.',
      HTTP_STATUS.UNAUTHORIZED
    );
  }
};

/**
 * Optional authentication - attaches user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      
      // Check if security user by flag or role
      if (decoded.isSecurity === true || decoded.role === ROLES.SECURITY) {
        const estate = await Estate.findById(decoded.id);

        if (estate && estate.isActive) {
          req.user = {
            _id: estate._id,  // ✅ Use ObjectId
            email: estate.contactEmail,
            role: ROLES.SECURITY,
            estateId: estate._id,
          };
          req.userId = estate._id;  // ✅ Use ObjectId
          req.userRole = ROLES.SECURITY;
        }
      } else {
        // Regular user
        const user = await User.findById(decoded.id).select('-password');

        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
          req.userRole = user.role;
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail the request, just proceed without user
    next();
  }
};

module.exports = {
  protect,
  optionalAuth,
};