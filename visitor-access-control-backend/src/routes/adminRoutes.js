const express = require('express');
const { body, param } = require('express-validator');
const {
  createEstate,
  getEstates,
  getEstate,
  updateEstate,
  deactivateEstate,
  getUsers,
  toggleUserActive,
  resetUserPassword,
  getSystemStats,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorize');
const validate = require('../middleware/validateInput');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect, isAdmin);

// Estate management routes
router.post(
  '/estates',
  [
    body('estateName')
      .trim()
      .notEmpty()
      .withMessage('Estate name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Estate name must be between 2 and 100 characters'),
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 4, max: 20 })
      .withMessage('Username must be between 4 and 20 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('address')
      .trim()
      .notEmpty()
      .withMessage('Address is required'),
    body('contactEmail')
      .trim()
      .notEmpty()
      .withMessage('Contact email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('contactPhone')
      .trim()
      .notEmpty()
      .withMessage('Contact phone is required')
      .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .withMessage('Please provide a valid phone number'),
  ],
  validate,
  createEstate
);

router.get('/estates', getEstates);

router.get(
  '/estates/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid estate ID'),
  ],
  validate,
  getEstate
);

router.put(
  '/estates/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid estate ID'),
    body('estateName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Estate name must be between 2 and 100 characters'),
    body('username')
      .optional()
      .trim()
      .isLength({ min: 4, max: 20 })
      .withMessage('Username must be between 4 and 20 characters'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('contactEmail')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('contactPhone')
      .optional()
      .trim()
      .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .withMessage('Please provide a valid phone number'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
  ],
  validate,
  updateEstate
);

router.delete(
  '/estates/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid estate ID'),
  ],
  validate,
  deactivateEstate
);

// User management routes
router.get('/users', getUsers);

router.put(
  '/users/:id/toggle-active',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID'),
  ],
  validate,
  toggleUserActive
);

router.post(
  '/users/:id/reset-password',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid user ID'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validate,
  resetUserPassword
);

// System statistics
router.get('/stats', getSystemStats);

module.exports = router;