const { Estate, User, TrustedContact, PreRegisteredVisitor, VisitorLog } = require('../models');
const { generateUniqueEstateCode } = require('../services/estateCodeGenerator');
const { sendSuccess, sendError, getPagination, getPaginationMeta } = require('../utils/helpers');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const { generateToken } = require('../utils/encryption');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * @route   POST /api/v1/admin/estates
 * @desc    Create a new estate
 * @access  Private (Admin)
 */
const createEstate = async (req, res, next) => {
  try {
    const {
      estateName,
      username,
      password,
      address,
      contactEmail,
      contactPhone,
    } = req.body;

    // Check if username already exists
    const existingEstate = await Estate.findOne({ username });
    if (existingEstate) {
      return sendError(
        res,
        'Username already exists. Please choose a different username.',
        HTTP_STATUS.CONFLICT
      );
    }

    // Generate unique estate code
    const estateCode = await generateUniqueEstateCode();

    // Create estate (password will be hashed by pre-save hook)
    const estate = await Estate.create({
      estateName,
      estateCode,
      username,
      password,
      address,
      contactEmail,
      contactPhone,
      isActive: true,
      createdBy: req.user._id,
    });

    logger.info(`Estate created by admin ${req.user.email}: ${estateName}`);

    return sendSuccess(
      res,
      'Estate created successfully',
      {
        estate: {
          id: estate._id,
          estateName: estate.estateName,
          estateCode: estate.estateCode,
          username: estate.username,
          address: estate.address,
          contactEmail: estate.contactEmail,
          contactPhone: estate.contactPhone,
          isActive: estate.isActive,
        },
        credentials: {
          estateCode: estate.estateCode,
          username: estate.username,
          password: password, // Return plain password only on creation
        },
      },
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Create estate error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/estates
 * @desc    Get all estates
 * @access  Private (Admin)
 */
const getEstates = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const { skip, limit: pageLimit } = getPagination(page, limit);

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { estateName: { $regex: search, $options: 'i' } },
        { estateCode: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const estates = await Estate.find(query)
      .populate('createdBy', 'fullName email')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    // Get resident count for each estate
    const estatesWithCounts = await Promise.all(
      estates.map(async (estate) => {
        const residentCount = await User.countDocuments({
          estateId: estate._id,
          role: ROLES.RESIDENT,
        });

        return {
          ...estate.toObject(),
          residentCount,
        };
      })
    );

    const totalEstates = await Estate.countDocuments(query);
    const pagination = getPaginationMeta(totalEstates, page, pageLimit);

    return sendSuccess(res, 'Estates retrieved successfully', {
      estates: estatesWithCounts,
      pagination,
    });
  } catch (error) {
    logger.error(`Get estates error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/estates/:id
 * @desc    Get single estate with details
 * @access  Private (Admin)
 */
const getEstate = async (req, res, next) => {
  try {
    const estate = await Estate.findById(req.params.id)
      .populate('createdBy', 'fullName email')
      .select('-password');

    if (!estate) {
      return sendError(res, 'Estate not found', HTTP_STATUS.NOT_FOUND);
    }

    // Get statistics
    const residentCount = await User.countDocuments({
      estateId: estate._id,
      role: ROLES.RESIDENT,
    });

    const trustedContactCount = await TrustedContact.countDocuments({
      estateId: estate._id,
    });

    const totalEntries = await VisitorLog.countDocuments({
      estateId: estate._id,
    });

    return sendSuccess(res, 'Estate details retrieved successfully', {
      estate: {
        ...estate.toObject(),
        statistics: {
          residentCount,
          trustedContactCount,
          totalEntries,
        },
      },
    });
  } catch (error) {
    logger.error(`Get estate error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/admin/estates/:id
 * @desc    Update estate
 * @access  Private (Admin)
 */
const updateEstate = async (req, res, next) => {
  try {
    const {
      estateName,
      username,
      password,
      address,
      contactEmail,
      contactPhone,
      isActive,
    } = req.body;

    const estate = await Estate.findById(req.params.id);

    if (!estate) {
      return sendError(res, 'Estate not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if username is being changed and if it's already taken
    if (username && username !== estate.username) {
      const existingEstate = await Estate.findOne({ username });
      if (existingEstate) {
        return sendError(
          res,
          'Username already exists',
          HTTP_STATUS.CONFLICT
        );
      }
      estate.username = username;
    }

    // Update fields
    if (estateName) estate.estateName = estateName;
    if (password) estate.password = password; // Will be hashed by pre-save hook
    if (address) estate.address = address;
    if (contactEmail) estate.contactEmail = contactEmail;
    if (contactPhone) estate.contactPhone = contactPhone;
    if (isActive !== undefined) estate.isActive = isActive;

    await estate.save();

    logger.info(`Estate updated by admin: ${estate.estateName}`);

    return sendSuccess(res, 'Estate updated successfully', {
      estate: {
        id: estate._id,
        estateName: estate.estateName,
        estateCode: estate.estateCode,
        username: estate.username,
        address: estate.address,
        contactEmail: estate.contactEmail,
        contactPhone: estate.contactPhone,
        isActive: estate.isActive,
      },
    });
  } catch (error) {
    logger.error(`Update estate error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/admin/estates/:id
 * @desc    Deactivate estate (soft delete)
 * @access  Private (Admin)
 */
const deactivateEstate = async (req, res, next) => {
  try {
    const estate = await Estate.findById(req.params.id);

    if (!estate) {
      return sendError(res, 'Estate not found', HTTP_STATUS.NOT_FOUND);
    }

    estate.isActive = false;
    await estate.save();

    logger.info(`Estate deactivated by admin: ${estate.estateName}`);

    return sendSuccess(res, 'Estate deactivated successfully');
  } catch (error) {
    logger.error(`Deactivate estate error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with filters
 * @access  Private (Admin)
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, estateId, search, isActive } = req.query;
    const { skip, limit: pageLimit } = getPagination(page, limit);

    // Build query
    const query = {};
    if (role) query.role = role;
    if (estateId) query.estateId = estateId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .populate('estateId', 'estateName estateCode')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const totalUsers = await User.countDocuments(query);
    const pagination = getPaginationMeta(totalUsers, page, pageLimit);

    return sendSuccess(res, 'Users retrieved successfully', {
      users,
      pagination,
    });
  } catch (error) {
    logger.error(`Get users error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/admin/users/:id/toggle-active
 * @desc    Activate or deactivate user
 * @access  Private (Admin)
 */
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return sendError(
        res,
        'You cannot deactivate your own account',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    user.isActive = !user.isActive;
    await user.save();

    logger.info(`User ${user.isActive ? 'activated' : 'deactivated'} by admin: ${user.email}`);

    return sendSuccess(res, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`, {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    logger.error(`Toggle user active error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   POST /api/v1/admin/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Admin)
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, 'User not found', HTTP_STATUS.NOT_FOUND);
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    logger.info(`Password reset by admin for user: ${user.email}`);

    return sendSuccess(res, 'Password reset successfully', {
      message: 'User can now login with the new password',
    });
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get system-wide statistics
 * @access  Private (Admin)
 */
const getSystemStats = async (req, res, next) => {
  try {
    const totalEstates = await Estate.countDocuments({ isActive: true });
    const totalResidents = await User.countDocuments({ role: ROLES.RESIDENT });
    const totalTrustedContacts = await TrustedContact.countDocuments({ isActive: true });
    const totalVisitorLogs = await VisitorLog.countDocuments();

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEntries = await VisitorLog.countDocuments({
      entryTime: { $gte: today },
    });

    const todayRegistrations = await User.countDocuments({
      role: ROLES.RESIDENT,
      createdAt: { $gte: today },
    });

    // This month's stats
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const monthlyEntries = await VisitorLog.countDocuments({
      entryTime: { $gte: firstDayOfMonth },
    });

    const monthlyRegistrations = await User.countDocuments({
      role: ROLES.RESIDENT,
      createdAt: { $gte: firstDayOfMonth },
    });

    return sendSuccess(res, 'System statistics retrieved successfully', {
      stats: {
        overall: {
          totalEstates,
          totalResidents,
          totalTrustedContacts,
          totalVisitorLogs,
        },
        today: {
          entries: todayEntries,
          registrations: todayRegistrations,
        },
        thisMonth: {
          entries: monthlyEntries,
          registrations: monthlyRegistrations,
        },
      },
    });
  } catch (error) {
    logger.error(`Get system stats error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  createEstate,
  getEstates,
  getEstate,
  updateEstate,
  deactivateEstate,
  getUsers,
  toggleUserActive,
  resetUserPassword,
  getSystemStats,
};