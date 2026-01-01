const express = require('express');
const { body, param } = require('express-validator');
const {
  verifyTOTP,
  searchVisitor,
  logEntry,
  logExit,
  getRecentEntries,
  getCurrentVisitors,
  getStats,
  getStatistics,
} = require('../controllers/securityController');
const { protect } = require('../middleware/auth');
const { isSecurity, isSecurityOrAdmin } = require('../middleware/authorize');
const validate = require('../middleware/validateInput');

const router = express.Router();

// All routes require authentication and security role
router.use(protect, isSecurity);

// TOTP verification (NO PHONE REQUIRED)
router.post(
  '/verify-totp',
  [
    body('token')
      .trim()
      .notEmpty()
      .withMessage('TOTP token is required')
      .matches(/^\d{6}$/)
      .withMessage('Token must be 6 digits'),
  ],
  validate,
  verifyTOTP
);

// Visitor search
router.post(
  '/search-visitor',
  [
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .withMessage('Please provide a valid phone number'),
  ],
  validate,
  searchVisitor
);

// Log visitor entry - ✅ FIXED: Added { checkFalsy: true } to all optional fields
router.post(
  '/log-entry',
  [
    body('visitorType')
      .trim()
      .notEmpty()
      .withMessage('Visitor type is required')
      .isIn(['trusted', 'pre-registered', 'walk-in'])
      .withMessage('Invalid visitor type'),
    body('visitorName')
      .trim()
      .notEmpty()
      .withMessage('Visitor name is required'),
    body('visitorPhone')
      .trim()
      .notEmpty()
      .withMessage('Visitor phone is required')
      .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .withMessage('Please provide a valid phone number'),
    body('verificationMethod')
      .trim()
      .notEmpty()
      .withMessage('Verification method is required')
      .isIn(['totp', 'pre-registration', 'manual'])
      .withMessage('Invalid verification method'),
    body('trustedContactId')
      .optional({ checkFalsy: true })  // ✅ FIXED: Allow empty string
      .isMongoId()
      .withMessage('Invalid trusted contact ID'),
    body('preRegisteredVisitorId')
      .optional({ checkFalsy: true })  // ✅ FIXED: Allow empty string
      .isMongoId()
      .withMessage('Invalid pre-registered visitor ID'),
    body('carPlateNumber')
      .optional({ checkFalsy: true })  // ✅ FIXED: Allow empty string
      .trim()
      .toUpperCase(),
    body('numberOfPeople')
      .optional({ checkFalsy: true })  // ✅ FIXED: Allow empty or default
      .isInt({ min: 1, max: 50 })
      .withMessage('Number of people must be between 1 and 50'),
    body('totpUsed')
      .optional({ checkFalsy: true })  // ✅ FIXED: Allow empty string
      .trim(),
    body('notes')
      .optional({ checkFalsy: true })  // ✅ FIXED: Allow empty string
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
  ],
  validate,
  logEntry
);

// Log visitor exit
router.put(
  '/log-exit/:logId',
  [
    param('logId')
      .isMongoId()
      .withMessage('Invalid log ID'),
  ],
  validate,
  logExit
);

// Get recent entries
router.get('/recent-entries', getRecentEntries);

// Get current visitors on premises
router.get('/current-visitors', getCurrentVisitors);

// Get dashboard statistics
router.get('/stats', getStats);
router.get('/statistics', getStatistics); 

module.exports = router;