const { TrustedContact, User, Estate } = require('../models');
const { generateToken, getTimeRemaining } = require('../services/totpService');
const QRCode = require('qrcode');
const { sendSuccess, sendError } = require('../utils/helpers');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * @route   GET /api/v1/access/:token
 * @desc    Get trusted contact access details (TOTP code, QR, etc.)
 * @access  Public (via unique token)
 */
const getAccessDetails = async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find trusted contact by access token
    const contact = await TrustedContact.findOne({
      accessToken: token,
      isActive: true,
    })
      .select('+totpSecret')
      .populate('residentId', 'fullName homeAddress phone')
      .populate('estateId', 'estateName estateCode address');

    if (!contact) {
      return sendError(
        res,
        'Invalid or expired access link',
        HTTP_STATUS.NOT_FOUND
      );
    }

    if (!contact.canGenerateTOTP()) {
      return sendError(
        res,
        'Access has been disabled. Please contact the resident.',
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Generate current TOTP code
    const currentCode = generateToken(contact.totpSecret, true);

    // Get time remaining until code expires
    const timeRemaining = getTimeRemaining();

    // Generate QR code with the current TOTP
    const qrCodeData = await QRCode.toDataURL(currentCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    logger.info(`Access link opened for: ${contact.fullName}`);

    return sendSuccess(res, 'Access details retrieved successfully', {
      contact: {
        fullName: contact.fullName,
        relationship: contact.relationship,
      },
      resident: {
        fullName: contact.residentId.fullName,
        homeAddress: contact.residentId.homeAddress,
        phone: contact.residentId.phone,
      },
      estate: {
        name: contact.estateId.estateName,
        code: contact.estateId.estateCode,
        address: contact.estateId.address,
      },
      access: {
        currentCode,
        timeRemaining, // Seconds until code expires
        qrCode: qrCodeData,
        lastUsed: contact.lastUsed,
        usageCount: contact.usageCount,
      },
      instructions: {
        step1: 'Show this 6-digit code to security at the gate',
        step2: 'Or let security scan the QR code',
        step3: 'Code refreshes every 30 seconds',
        step4: `You're visiting: ${contact.residentId.fullName} at ${contact.residentId.homeAddress}`,
      },
    });
  } catch (error) {
    logger.error(`Get access details error: ${error.message}`);
    next(error);
  }
};

/**
 * @route   GET /api/v1/access/:token/refresh
 * @desc    Get new TOTP code (for live refresh without full page reload)
 * @access  Public (via unique token)
 */
const refreshCode = async (req, res, next) => {
  try {
    const { token } = req.params;

    const contact = await TrustedContact.findOne({
      accessToken: token,
      isActive: true,
      totpEnabled: true,
    }).select('+totpSecret');

    if (!contact) {
      return sendError(
        res,
        'Invalid access link',
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Generate current TOTP code
    const currentCode = generateToken(contact.totpSecret, true);
    const timeRemaining = getTimeRemaining();

    // Generate QR code
    const qrCodeData = await QRCode.toDataURL(currentCode, {
      width: 300,
      margin: 2,
    });

    return sendSuccess(res, 'Code refreshed', {
      currentCode,
      timeRemaining,
      qrCode: qrCodeData,
    });
  } catch (error) {
    logger.error(`Refresh code error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  getAccessDetails,
  refreshCode,
};