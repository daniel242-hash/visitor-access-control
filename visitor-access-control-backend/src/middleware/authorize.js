const { sendError } = require('../utils/helpers');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Middleware to restrict access to specific roles
 * @param  {...string} roles - Allowed roles
 * @returns Middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return sendError(
          res,
          'Authentication required',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      // Check if user's role is allowed
      if (!roles.includes(req.user.role)) {
        logger.warn(
          `Unauthorized access attempt by user ${req.user._id} with role ${req.user.role}`
        );
        
        return sendError(
          res,
          'You do not have permission to perform this action',
          HTTP_STATUS.FORBIDDEN
        );
      }

      next();
    } catch (error) {
      logger.error(`Authorization error: ${error.message}`);
      return sendError(
        res,
        'Authorization failed',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  };
};

/**
 * Middleware to ensure user is a resident
 */
const isResident = authorize(ROLES.RESIDENT);

/**
 * Middleware to ensure user is security personnel
 */
const isSecurity = authorize(ROLES.SECURITY);

/**
 * Middleware to ensure user is an admin
 */
const isAdmin = authorize(ROLES.ADMIN);

/**
 * Middleware to ensure user is either security or admin
 */
const isSecurityOrAdmin = authorize(ROLES.SECURITY, ROLES.ADMIN);

/**
 * Middleware to ensure user belongs to a specific estate
 */
const belongsToEstate = (req, res, next) => {
  try {
    const { estateId } = req.params;

    // Admin can access any estate
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Check if user belongs to the estate
    const userEstateId = req.user.estateId || req.user.assignedEstateId;

    if (!userEstateId || userEstateId.toString() !== estateId) {
      return sendError(
        res,
        'You do not have access to this estate',
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  } catch (error) {
    logger.error(`Estate authorization error: ${error.message}`);
    return sendError(
      res,
      'Authorization failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Middleware to ensure user can only access their own resources
 */
const isOwner = (req, res, next) => {
  try {
    const resourceUserId = req.params.userId || req.params.residentId;

    // Admin can access any resource
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }

    // Check if user is accessing their own resource
    if (req.user._id.toString() !== resourceUserId) {
      return sendError(
        res,
        'You can only access your own resources',
        HTTP_STATUS.FORBIDDEN
      );
    }

    next();
  } catch (error) {
    logger.error(`Ownership authorization error: ${error.message}`);
    return sendError(
      res,
      'Authorization failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

module.exports = {
  authorize,
  isResident,
  isSecurity,
  isAdmin,
  isSecurityOrAdmin,
  belongsToEstate,
  isOwner,
};