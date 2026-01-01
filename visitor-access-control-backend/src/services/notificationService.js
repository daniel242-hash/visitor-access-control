const { Notification } = require('../models');
const { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } = require('../config/constants');
const logger = require('../utils/logger');

/**
 * Create a notification for a user
 */
const createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    logger.info(`Notification created for user: ${data.userId}`);
    return notification;
  } catch (error) {
    logger.error(`Create notification error: ${error.message}`);
    throw error;
  }
};

/**
 * Create visitor arrival notification
 */
const createVisitorArrivalNotification = async (residentId, estateId, visitorName, visitorLogId) => {
  return createNotification({
    userId: residentId,
    estateId,
    type: NOTIFICATION_TYPES.VISITOR_ARRIVAL,
    title: 'Visitor Arriving',
    message: `${visitorName} has been granted access at the gate and is on their way to your house`,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    relatedVisitorLog: visitorLogId,
    data: {
      visitorName,
    },
  });
};

/**
 * Create trusted contact entry notification
 */
const createTrustedContactNotification = async (residentId, estateId, contactName, visitorLogId) => {
  return createNotification({
    userId: residentId,
    estateId,
    type: NOTIFICATION_TYPES.TOTP_USED,  // Changed from TRUSTED_CONTACT to TOTP_USED
    title: 'Trusted Contact Entry',
    message: `${contactName} accessed the estate using their trusted contact code`,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    relatedVisitorLog: visitorLogId,
    data: {
      contactName,
    },
  });
};

/**
 * Create visitor exit notification
 */
const createVisitorExitNotification = async (residentId, estateId, visitorName, visitorLogId) => {
  return createNotification({
    userId: residentId,
    estateId,
    type: NOTIFICATION_TYPES.VISITOR_ARRIVAL, // Using VISITOR_ARRIVAL for exits too, or add VISITOR_EXIT to constants
    title: 'Visitor Departed',
    message: `${visitorName} has left the estate`,
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    relatedVisitorLog: visitorLogId,
    data: {
      visitorName,
    },
  });
};

module.exports = {
  createNotification,
  createVisitorArrivalNotification,
  createTrustedContactNotification,
  createVisitorExitNotification,
};