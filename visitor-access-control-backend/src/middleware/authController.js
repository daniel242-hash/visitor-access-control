const { User, Estate } = require('../models');
const { generateTokens, verifyRefreshToken } = require('../services/jwtService');
const { sendSuccess, sendError, AppError } = require('../utils/helpers');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const { generateToken } = require('../utils/encryption');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * @route   POST /api/v1/auth/register/resident
 * @desc    Register a new resident
 * @access  Public
 */
const registerResident = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, homeAddress, estateCode } = req.body;

    // Check if estate exists
    const estate = await Estate.findOne({
      estateCode: estateCode.toUpperCase(),
      isActive: true,
    });

    if (!estate) {
      return sendError(
        res,
        'Invalid estate code. Please check with your estate management.',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'Email' : 'Phone number';
      return sendError(
        res,
        `${field} already registered. Please login instead.`,
        HTTP_STATUS.CONFLICT
      );
    }

    // Create new resident
    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      homeAddress,
      estateId: estate._id,
      estateCode: estate.estateCode,
      role: ROLES.RESIDENT,
    });

    // Generate tokens
    const tokens = generateTokens(user);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`New resident registered: ${user.email} for estate ${estate.estateName}`);

    // Return user data without password
    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      homeAddress: user.homeAddress,
      estateId: user.estateId,
      estateName: estate.estateName,
      acceptingVisitors: user.acceptingVisitors,
    };

    return sendSuccess(
      res,
      'Registration successful! Welcome to the system.',
      {
        user: userData,
        tokens,
      },
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Resident registration error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login for residents and admins
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return sendError(
        res,
        'Invalid email or password',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return sendError(
        res,
        'Your account has been deactivated. Please contact support.',
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Compare password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return sendError(
        res,
        'Invalid email or password',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email} (${user.role})`);

    // Get estate info if resident
    let estateInfo = null;
    if (user.role === ROLES.RESIDENT && user.estateId) {
      const estate = await Estate.findById(user.estateId);
      estateInfo = estate ? { id: estate._id, name: estate.estateName } : null;
    }

    // Return user data without password
    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      ...(user.role === ROLES.RESIDENT && {
        homeAddress: user.homeAddress,
        estateId: user.estateId,
        estate: estateInfo,
        acceptingVisitors: user.acceptingVisitors,
      }),
    };

    return sendSuccess(res, 'Login successful!', {
      user: userData,
      tokens,
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/login/security
 * @desc    Login for security personnel using estate code or username
 * @access  Public
 */
const securityLogin = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // Find estate by code or username
    const estate = await Estate.findOne({
      $or: [
        { estateCode: identifier.toUpperCase() },
        { username: identifier },
      ],
      isActive: true,
    });

    if (!estate) {
      return sendError(
        res,
        'Invalid credentials',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Compare password with estate password
    const isPasswordCorrect = await bcrypt.compare(password, estate.password);

    if (!isPasswordCorrect) {
      return sendError(
        res,
        'Invalid credentials',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // ✅ FIXED: Use estate._id directly as an ObjectId, not a string with prefix
    const securityUser = {
      _id: estate._id,  // ✅ Use the actual estate ObjectId
      email: estate.contactEmail,
      role: ROLES.SECURITY,
      estateId: estate._id,
      isSecurity: true,  // ✅ Add flag to identify as security user
    };

    // Generate tokens
    const tokens = generateTokens(securityUser);

    logger.info(`Security login for estate: ${estate.estateName}`);

    return sendSuccess(res, 'Security login successful!', {
      estate: {
        id: estate._id,
        name: estate.estateName,
        code: estate.estateCode,
        username: estate.username,
      },
      role: ROLES.SECURITY,
      tokens,
    });
  } catch (error) {
    logger.error(`Security login error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return sendError(
        res,
        'Refresh token is required',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Check if this is a security user
    if (decoded.isSecurity === true || decoded.role === ROLES.SECURITY) {
      const estate = await Estate.findById(decoded.id);

      if (!estate || !estate.isActive) {
        return sendError(
          res,
          'Invalid refresh token',
          HTTP_STATUS.UNAUTHORIZED
        );
      }

      // Generate new tokens for security user
      const securityUser = {
        _id: estate._id,
        email: estate.contactEmail,
        role: ROLES.SECURITY,
        estateId: estate._id,
        isSecurity: true,
      };

      const tokens = generateTokens(securityUser);

      return sendSuccess(res, 'Token refreshed successfully', { tokens });
    }

    // Regular user
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return sendError(
        res,
        'Invalid refresh token',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    return sendSuccess(res, 'Token refreshed successfully', { tokens });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    
    next(error);
  }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('estateId', 'estateName estateCode address')
      .select('-password');

    if (!user) {
      return sendError(
        res,
        'User not found',
        HTTP_STATUS.NOT_FOUND
      );
    }

    return sendSuccess(res, 'Profile retrieved successfully', { user });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset token
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return sendSuccess(
        res,
        'If that email exists, a password reset link has been sent.'
      );
    }

    // Generate reset token
    const resetToken = generateToken(32);
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // TODO: Send email with reset token
    // For now, we'll just log it (in production, send via email)
    logger.info(`Password reset token for ${email}: ${resetToken}`);

    return sendSuccess(
      res,
      'If that email exists, a password reset link has been sent.'
    );
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return sendError(
        res,
        'Invalid or expired reset token',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`Password reset successful for user: ${user.email}`);

    return sendSuccess(res, 'Password reset successful! You can now login.');
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (client should delete token)
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // But we can log it for audit purposes
    logger.info(`User logged out: ${req.user.email || 'Security user'}`);

    return sendSuccess(res, 'Logout successful');
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  registerResident,
  login,
  securityLogin,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
  logout,
};