const express = require('express');
const { param } = require('express-validator');
const {
  getAccessDetails,
  refreshCode,
} = require('../controllers/accessController');
const validate = require('../middleware/validateInput');

const router = express.Router();

// Public routes (no authentication required - secured by unique token)

// Get access details
router.get(
  '/:token',
  [
    param('token')
      .notEmpty()
      .withMessage('Access token is required')
      .isLength({ min: 32, max: 128 })
      .withMessage('Invalid token format'),
  ],
  validate,
  getAccessDetails
);

// Refresh code (for live updates)
router.get(
  '/:token/refresh',
  [
    param('token')
      .notEmpty()
      .withMessage('Access token is required')
      .isLength({ min: 32, max: 128 })
      .withMessage('Invalid token format'),
  ],
  validate,
  refreshCode
);

module.exports = router;