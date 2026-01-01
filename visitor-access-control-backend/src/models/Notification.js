const mongoose = require('mongoose');
const { NOTIFICATION_TYPES, NOTIFICATION_CHANNELS } = require('../config/constants');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    estateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Estate',
      index: true,
    },
    
    // Notification content
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: Object.values(NOTIFICATION_TYPES),
        message: '{VALUE} is not a valid notification type',
      },
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    
    // Delivery channels
    channels: {
      type: [String],
      enum: Object.values(NOTIFICATION_CHANNELS),
      default: [NOTIFICATION_CHANNELS.IN_APP],
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    smsSent: {
      type: Boolean,
      default: false,
    },
    emailError: String,
    smsError: String,
    
    // Metadata
    relatedVisitorLog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VisitorLog',
    },
    data: {
      type: mongoose.Schema.Types.Mixed, // Additional data as JSON
    },
    
    // Read status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
};

// Instance method to check if email should be sent
notificationSchema.methods.shouldSendEmail = function () {
  return this.channels.includes(NOTIFICATION_CHANNELS.EMAIL) && !this.emailSent;
};

// Instance method to check if SMS should be sent
notificationSchema.methods.shouldSendSMS = function () {
  return this.channels.includes(NOTIFICATION_CHANNELS.SMS) && !this.smsSent;
};

// Instance method to mark email as sent
notificationSchema.methods.markEmailSent = async function (error = null) {
  this.emailSent = !error;
  if (error) this.emailError = error;
  await this.save();
};

// Instance method to mark SMS as sent
notificationSchema.methods.markSMSSent = async function (error = null) {
  this.smsSent = !error;
  if (error) this.smsError = error;
  await this.save();
};

// Static method to get unread notifications for a user
notificationSchema.statics.getUnreadByUser = async function (userId, limit = 20) {
  return await this.find({
    userId,
    isRead: false,
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsReadForUser = async function (userId) {
  return await this.updateMany(
    { userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({
    userId,
    isRead: false,
  });
};

// Static method to delete old read notifications (older than 90 days)
notificationSchema.statics.deleteOldNotifications = async function (days = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await this.deleteMany({
    isRead: true,
    createdAt: { $lt: cutoffDate },
  });

  return result.deletedCount;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;