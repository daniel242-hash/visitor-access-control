const { User, TrustedContact, PreRegisteredVisitor, VisitorLog, Estate, Notification } = require('../models');
const { generateTOTPSetup } = require('../services/totpService');
const { sendSuccess, sendError, getPagination, getPaginationMeta } = require('../utils/helpers');
const { HTTP_STATUS, VISITOR_STATUS } = require('../config/constants');
const config = require('../config/env');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * @route   GET /api/v1/resident/profile
 * @desc    Get resident profile
 * @access  Private (Resident)
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('estateId', 'estateName estateCode address contactEmail contactPhone')
      .select('-password');

    if (!user) {
      return sendError(res, 'Profile not found', HTTP_STATUS.NOT_FOUND);
    }

    return sendSuccess(res, 'Profile retrieved successfully', { user });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/resident/profile
 * @desc    Update resident profile
 * @access  Private (Resident)
 */
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, email, phone, homeAddress, estateCode } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 'User not found', HTTP_STATUS.NOT_FOUND);
    }

    // Check if email is being changed and already exists
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return sendError(
          res,
          'Email address is already in use',
          HTTP_STATUS.CONFLICT
        );
      }
      user.email = email;
    }

    // Handle estate code change (relocation)
    if (estateCode && estateCode !== user.estateCode) {
      const newEstate = await Estate.findOne({ estateCode });
      
      if (!newEstate) {
        return sendError(
          res,
          'Invalid estate code. Please verify with your new estate management.',
          HTTP_STATUS.NOT_FOUND
        );
      }

      if (!newEstate.isActive) {
        return sendError(
          res,
          'This estate is currently inactive. Please contact support.',
          HTTP_STATUS.BAD_REQUEST
        );
      }

      user.estateId = newEstate._id;
      user.estateCode = estateCode;

      logger.info(`User ${user.email} relocated to estate: ${newEstate.estateName}`);
    }

    // Update other fields
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (homeAddress) user.homeAddress = homeAddress;

    await user.save();

    await user.populate('estateId', 'estateName estateCode address');

    logger.info(`Profile updated for user: ${user.email}`);

    return sendSuccess(res, 'Profile updated successfully', {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        homeAddress: user.homeAddress,
        estate: user.estateId,
      },
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/resident/change-password
 * @desc    Change user password
 * @access  Private (Resident)
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return sendError(res, 'User not found', HTTP_STATUS.NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return sendError(
        res,
        'Current password is incorrect',
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    
    if (isSamePassword) {
      return sendError(
        res,
        'New password must be different from current password',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    return sendSuccess(res, 'Password changed successfully');
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/resident/toggle-visitors
 * @desc    Toggle accepting visitors
 * @access  Private (Resident)
 */
const toggleAcceptingVisitors = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return sendError(res, 'User not found', HTTP_STATUS.NOT_FOUND);
    }

    user.acceptingVisitors = !user.acceptingVisitors;
    await user.save();

    logger.info(`User ${user.email} ${user.acceptingVisitors ? 'enabled' : 'disabled'} visitor acceptance`);

    return sendSuccess(res, `Visitor acceptance ${user.acceptingVisitors ? 'enabled' : 'disabled'}`, {
      acceptingVisitors: user.acceptingVisitors,
    });
  } catch (error) {
    logger.error(`Toggle visitors error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/resident/trusted-contacts
 * @desc    Get all trusted contacts
 * @access  Private (Resident)
 */
const getTrustedContacts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip, limit: pageLimit } = getPagination(page, limit);

    const contacts = await TrustedContact.find({
      residentId: req.user._id,
    })
      .select('-totpSecret')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const totalContacts = await TrustedContact.countDocuments({
      residentId: req.user._id,
    });

    const pagination = getPaginationMeta(totalContacts, page, pageLimit);

    return sendSuccess(res, 'Trusted contacts retrieved successfully', {
      contacts,
      pagination,
    });
  } catch (error) {
    logger.error(`Get trusted contacts error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   POST /api/v1/resident/trusted-contacts
 * @desc    Add a new trusted contact
 * @access  Private (Resident)
 */
const addTrustedContact = async (req, res, next) => {
  try {
    const { fullName, phone, email, relationship, notes } = req.body;

    const existingContact = await TrustedContact.findOne({
      residentId: req.user._id,
      phone,
    });

    if (existingContact) {
      return sendError(
        res,
        'This phone number is already added as a trusted contact',
        HTTP_STATUS.CONFLICT
      );
    }

    const estate = await Estate.findById(req.user.estateId);

    const totpSetup = await generateTOTPSetup(fullName, phone, estate.estateName);

    const contact = await TrustedContact.create({
      residentId: req.user._id,
      estateId: req.user.estateId,
      fullName,
      phone,
      email,
      relationship,
      notes,
      totpSecret: totpSetup.secret,
      totpEnabled: true,
    });

    logger.info(`Trusted contact added by ${req.user.email}: ${fullName}`);

    const accessLink = `${config.frontendUrl}/access/${contact.accessToken}`;

    return sendSuccess(
      res,
      'Trusted contact added successfully',
      {
        contact: {
          id: contact._id,
          fullName: contact.fullName,
          phone: contact.phone,
          email: contact.email,
          relationship: contact.relationship,
          notes: contact.notes,
          totpEnabled: contact.totpEnabled,
          accessLink,
        },
        setup: {
          accessLink,
          qrCode: totpSetup.qrCode,
          instructions: {
            step1: `Share this link with ${fullName}`,
            step2: 'They can open it anytime to see their access code',
            step3: 'The code refreshes every 30 seconds',
            step4: 'Show the code to security for entry',
            link: accessLink,
          },
        },
      },
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Add trusted contact error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/resident/trusted-contacts/:id
 * @desc    Get single trusted contact
 * @access  Private (Resident)
 */
const getTrustedContact = async (req, res, next) => {
  try {
    const contact = await TrustedContact.findOne({
      _id: req.params.id,
      residentId: req.user._id,
    }).select('-totpSecret');

    if (!contact) {
      return sendError(res, 'Trusted contact not found', HTTP_STATUS.NOT_FOUND);
    }

    return sendSuccess(res, 'Trusted contact retrieved successfully', { contact });
  } catch (error) {
    logger.error(`Get trusted contact error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/resident/trusted-contacts/:id
 * @desc    Update trusted contact
 * @access  Private (Resident)
 */
const updateTrustedContact = async (req, res, next) => {
  try {
    const { fullName, email, relationship, notes, totpEnabled } = req.body;

    const contact = await TrustedContact.findOne({
      _id: req.params.id,
      residentId: req.user._id,
    });

    if (!contact) {
      return sendError(res, 'Trusted contact not found', HTTP_STATUS.NOT_FOUND);
    }

    if (fullName) contact.fullName = fullName;
    if (email !== undefined) contact.email = email;
    if (relationship) contact.relationship = relationship;
    if (notes !== undefined) contact.notes = notes;
    if (totpEnabled !== undefined) contact.totpEnabled = totpEnabled;

    await contact.save();

    logger.info(`Trusted contact updated: ${contact.fullName}`);

    return sendSuccess(res, 'Trusted contact updated successfully', {
      contact: {
        id: contact._id,
        fullName: contact.fullName,
        phone: contact.phone,
        email: contact.email,
        relationship: contact.relationship,
        notes: contact.notes,
        totpEnabled: contact.totpEnabled,
      },
    });
  } catch (error) {
    logger.error(`Update trusted contact error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/resident/trusted-contacts/:id
 * @desc    Delete trusted contact
 * @access  Private (Resident)
 */
const deleteTrustedContact = async (req, res, next) => {
  try {
    const contact = await TrustedContact.findOneAndDelete({
      _id: req.params.id,
      residentId: req.user._id,
    });

    if (!contact) {
      return sendError(res, 'Trusted contact not found', HTTP_STATUS.NOT_FOUND);
    }

    logger.info(`Trusted contact deleted: ${contact.fullName}`);

    return sendSuccess(res, 'Trusted contact deleted successfully');
  } catch (error) {
    logger.error(`Delete trusted contact error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/resident/visitors/pre-registered
 * @desc    Get all pre-registered visitors
 * @access  Private (Resident)
 */
const getPreRegisteredVisitors = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const { skip, limit: pageLimit } = getPagination(page, limit);

    const query = { residentId: req.user._id };
    if (status) query.status = status;

    const visitors = await PreRegisteredVisitor.find(query)
      .sort({ expectedArrivalDate: -1 })
      .skip(skip)
      .limit(pageLimit);

    const totalVisitors = await PreRegisteredVisitor.countDocuments(query);
    const pagination = getPaginationMeta(totalVisitors, page, pageLimit);

    return sendSuccess(res, 'Pre-registered visitors retrieved successfully', {
      visitors,
      pagination,
    });
  } catch (error) {
    logger.error(`Get pre-registered visitors error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   POST /api/v1/resident/visitors/pre-register
 * @desc    Pre-register a visitor (DATE ONLY - no time)
 * @access  Private (Resident)
 */
const preRegisterVisitor = async (req, res, next) => {
  try {
    const {
      visitorName,
      visitorPhone,
      carPlateNumber,
      numberOfPeople,
      complexion,
      purpose,
      additionalNotes,
      expectedArrivalDate,
      allowEarlyArrival,  // ✅ NEW FIELD
    } = req.body;

    if (!req.user.acceptingVisitors) {
      return sendError(
        res,
        'You have disabled visitor acceptance. Please enable it first.',
        HTTP_STATUS.FORBIDDEN
      );
    }

    const arrivalDate = new Date(expectedArrivalDate);
    arrivalDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (arrivalDate < today) {
      return sendError(
        res,
        'Expected arrival date cannot be in the past',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const validUntil = new Date(arrivalDate);
    validUntil.setHours(23, 59, 59, 999);

    const visitorData = {
      residentId: req.user._id,
      estateId: req.user.estateId,
      visitorName,
      visitorPhone,
      expectedArrivalDate: arrivalDate,
      validUntil: validUntil,
      status: VISITOR_STATUS.PENDING,
      allowEarlyArrival: allowEarlyArrival || false,  // ✅ NEW FIELD
    };

    if (carPlateNumber) visitorData.carPlateNumber = carPlateNumber;
    if (numberOfPeople) visitorData.numberOfPeople = numberOfPeople;
    if (complexion) visitorData.complexion = complexion;
    if (purpose) visitorData.purpose = purpose;
    if (additionalNotes) visitorData.additionalNotes = additionalNotes;

    const visitor = await PreRegisteredVisitor.create(visitorData);

    logger.info(`Visitor pre-registered by ${req.user.email}: ${visitorName} for ${arrivalDate.toDateString()}, Early arrival: ${allowEarlyArrival}`);

    return sendSuccess(
      res,
      'Visitor pre-registered successfully. Valid until end of day.',
      { 
        visitor: {
          id: visitor._id,
          visitorName: visitor.visitorName,
          visitorPhone: visitor.visitorPhone,
          carPlateNumber: visitor.carPlateNumber,
          numberOfPeople: visitor.numberOfPeople,
          complexion: visitor.complexion,
          purpose: visitor.purpose,
          additionalNotes: visitor.additionalNotes,
          expectedArrivalDate: visitor.expectedArrivalDate,
          validUntil: visitor.validUntil,
          status: visitor.status,
          allowEarlyArrival: visitor.allowEarlyArrival,  // ✅ NEW FIELD
        }
      },
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error(`Pre-register visitor error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/resident/visitors/pre-registered/:id
 * @desc    Cancel pre-registered visitor
 * @access  Private (Resident)
 */
const cancelPreRegisteredVisitor = async (req, res, next) => {
  try {
    const visitor = await PreRegisteredVisitor.findOne({
      _id: req.params.id,
      residentId: req.user._id,
    });

    if (!visitor) {
      return sendError(res, 'Visitor not found', HTTP_STATUS.NOT_FOUND);
    }

    if (visitor.status !== VISITOR_STATUS.PENDING) {
      return sendError(
        res,
        'Cannot cancel visitor. Status must be pending.',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await visitor.deleteOne();

    logger.info(`Pre-registered visitor cancelled: ${visitor.visitorName}`);

    return sendSuccess(res, 'Visitor registration cancelled successfully');
  } catch (error) {
    logger.error(`Cancel visitor error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/resident/visitors/logs
 * @desc    Get visitor logs (history)
 * @access  Private (Resident)
 */
const getVisitorLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { skip, limit: pageLimit } = getPagination(page, limit);

    const logs = await VisitorLog.find({ residentId: req.user._id })
      .populate('trustedContactId', 'fullName relationship')
      .populate('preRegisteredVisitorId', 'purpose')
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(pageLimit);

    const totalLogs = await VisitorLog.countDocuments({ residentId: req.user._id });
    const pagination = getPaginationMeta(totalLogs, page, pageLimit);

    return sendSuccess(res, 'Visitor logs retrieved successfully', {
      logs,
      pagination,
    });
  } catch (error) {
    logger.error(`Get visitor logs error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/resident/notifications
 * @desc    Get notifications for resident
 * @access  Private (Resident)
 */
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const { skip, limit: pageLimit } = getPagination(page, limit);

    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit);

    const unreadCount = await Notification.getUnreadCount(req.user._id);
    const totalNotifications = await Notification.countDocuments(query);
    const pagination = getPaginationMeta(totalNotifications, page, pageLimit);

    return sendSuccess(res, 'Notifications retrieved successfully', {
      notifications,
      unreadCount,
      pagination,
    });
  } catch (error) {
    logger.error(`Get notifications error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/resident/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private (Resident)
 */
const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return sendError(res, 'Notification not found', HTTP_STATUS.NOT_FOUND);
    }

    await notification.markAsRead();

    return sendSuccess(res, 'Notification marked as read');
  } catch (error) {
    logger.error(`Mark notification as read error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/resident/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private (Resident)
 */
const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.markAllAsReadForUser(req.user._id);

    logger.info(`All notifications marked as read for user: ${req.user.email}`);

    return sendSuccess(res, 'All notifications marked as read');
  } catch (error) {
    logger.error(`Mark all notifications as read error: ${error.message}`);
    next(error);
  }
};

module.exports = {
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
};