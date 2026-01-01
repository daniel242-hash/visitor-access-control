const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getProfile,
  updateProfile,
  changePassword,
  toggleAcceptingVisitors,
  getTrustedContacts,
  addTrustedContact,
  getTrustedContact,
  updateTrustedContact,
  deleteTrustedContact,
  getPreRegisteredVisitors,
  preRegisterVisitor,
  cancelPreRegisteredVisitor,
  getVisitorLogs,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/residentController');
const { protect } = require('../middleware/auth');
const { isResident } = require('../middleware/authorize');
const validate = require('../middleware/validateInput');

const router = express.Router();

// All routes require authentication and resident role
router.use(protect, isResident);

// Profile routes
router.get('/profile', getProfile);

router.put(
  '/profile',
  [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('phone')
      .optional()
      .trim()
      .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .withMessage('Please provide a valid phone number'),
    body('homeAddress')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Home address cannot be empty'),
    body('estateCode')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Estate code cannot be empty')
      .isLength({ min: 5 })
      .withMessage('Estate code must be at least 5 characters'),
  ],
  validate,
  updateProfile
);

router.put(
  '/change-password',
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Please confirm your new password')
      .custom((value, { req }) => value === req.body.newPassword)
      .withMessage('Passwords do not match'),
  ],
  validate,
  changePassword
);

router.put('/toggle-visitors', toggleAcceptingVisitors);

// Trusted contacts routes
router.get('/trusted-contacts', getTrustedContacts);

router.post(
  '/trusted-contacts',
  [
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .withMessage('Please provide a valid phone number'),
    body('email')
      .optional({ checkFalsy: true })
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('relationship')
      .trim()
      .notEmpty()
      .withMessage('Relationship is required'),
    body('notes')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),
  ],
  validate,
  addTrustedContact
);

router.get(
  '/trusted-contacts/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid contact ID'),
  ],
  validate,
  getTrustedContact
);

router.put(
  '/trusted-contacts/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid contact ID'),
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('relationship')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Relationship cannot be empty'),
    body('totpEnabled')
      .optional()
      .isBoolean()
      .withMessage('TOTP enabled must be a boolean'),
  ],
  validate,
  updateTrustedContact
);

router.delete(
  '/trusted-contacts/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid contact ID'),
  ],
  validate,
  deleteTrustedContact
);

// Pre-registered visitors routes
router.get('/visitors/pre-registered', getPreRegisteredVisitors);

// ✅ UPDATED: Added allowEarlyArrival validation
router.post(
  '/visitors/pre-register',
  [
    body('visitorName')
      .trim()
      .notEmpty()
      .withMessage('Visitor name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Visitor name must be between 2 and 100 characters'),
    body('visitorPhone')
      .trim()
      .notEmpty()
      .withMessage('Visitor phone is required')
      .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .withMessage('Please provide a valid phone number'),
    body('carPlateNumber')
      .optional({ checkFalsy: true })
      .trim()
      .toUpperCase(),
    body('numberOfPeople')
      .optional({ checkFalsy: true })
      .isInt({ min: 1, max: 50 })
      .withMessage('Number of people must be between 1 and 50'),
    body('complexion')
      .optional({ checkFalsy: true })
      .trim(),
    body('purpose')
      .trim()
      .notEmpty()
      .withMessage('Visit purpose is required'),
    body('additionalNotes')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 500 })
      .withMessage('Additional notes cannot exceed 500 characters'),
    body('expectedArrivalDate')
      .notEmpty()
      .withMessage('Expected arrival date is required')
      .isISO8601()
      .withMessage('Invalid date format')
      .custom((value) => {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          throw new Error('Expected arrival date cannot be in the past');
        }
        return true;
      }),
    body('allowEarlyArrival')  // ✅ NEW VALIDATION
      .optional({ checkFalsy: true })
      .isBoolean()
      .withMessage('Allow early arrival must be a boolean'),
  ],
  validate,
  preRegisterVisitor
);

router.delete(
  '/visitors/pre-registered/:id',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid visitor ID'),
  ],
  validate,
  cancelPreRegisteredVisitor
);

// Visitor logs routes
router.get('/visitors/logs', getVisitorLogs);

// Notification routes
router.get('/notifications', getNotifications);

router.put(
  '/notifications/:id/read',
  [
    param('id')
      .isMongoId()
      .withMessage('Invalid notification ID'),
  ],
  validate,
  markNotificationAsRead
);

router.put('/notifications/read-all', markAllNotificationsAsRead);

module.exports = router;