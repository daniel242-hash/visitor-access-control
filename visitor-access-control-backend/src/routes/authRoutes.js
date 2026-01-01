const express = require('express');
const { body } = require('express-validator');
const {
  registerResident,
  login,
  securityLogin,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  logout,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validateInput');
const { authLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
    .withMessage('Please provide a valid phone number'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('homeAddress')
    .trim()
    .notEmpty()
    .withMessage('Home address is required'),
  
  body('estateCode')
    .trim()
    .notEmpty()
    .withMessage('Estate code is required')
    .isLength({ min: 5 })
    .withMessage('Estate code must be at least 5 characters'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const securityLoginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('Estate code or username is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
];

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

// Routes
router.post(
  '/register/resident',
  authLimiter,
  registerValidation,
  validate,
  registerResident
);

router.post(
  '/login',
  authLimiter,
  loginValidation,
  validate,
  login
);

router.post(
  '/login/security',
  authLimiter,
  securityLoginValidation,
  validate,
  securityLogin
);

router.post(
  '/refresh-token',
  refreshTokenValidation,
  validate,
  refreshToken
);

router.get('/me', protect, getMe);

router.post(
  '/forgot-password',
  sensitiveLimiter,
  forgotPasswordValidation,
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  sensitiveLimiter,
  resetPasswordValidation,
  validate,
  resetPassword
);

router.post('/logout', protect, logout);

module.exports = router;