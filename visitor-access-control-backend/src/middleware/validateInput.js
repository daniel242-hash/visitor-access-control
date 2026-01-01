const { validationResult } = require('express-validator');
const { sendError } = require('../utils/helpers');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Middleware to validate request using express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return sendError(
      res,
      'Validation failed',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      formattedErrors
    );
  }

  next();
};

module.exports = validate;