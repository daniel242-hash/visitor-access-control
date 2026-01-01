const mongoose = require('mongoose');
const { VISITOR_TYPES, VERIFICATION_METHODS } = require('../config/constants');

const visitorLogSchema = new mongoose.Schema(
  {
    estateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Estate',
      required: [true, 'Estate ID is required'],
      index: true,
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resident ID is required'],
      index: true,
    },
    
    // Visitor identification
    visitorType: {
      type: String,
      required: [true, 'Visitor type is required'],
      enum: {
        values: Object.values(VISITOR_TYPES),
        message: '{VALUE} is not a valid visitor type',
      },
      index: true,
    },
    trustedContactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrustedContact',
      required: function () {
        return this.visitorType === VISITOR_TYPES.TRUSTED;
      },
    },
    preRegisteredVisitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PreRegisteredVisitor',
      required: function () {
        return this.visitorType === VISITOR_TYPES.PRE_REGISTERED;
      },
    },
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
    },
    visitorPhone: {
      type: String,
      required: [true, 'Visitor phone is required'],
      trim: true,
      index: true,
    },
    
    // Verification method
    verificationMethod: {
      type: String,
      required: [true, 'Verification method is required'],
      enum: {
        values: Object.values(VERIFICATION_METHODS),
        message: '{VALUE} is not a valid verification method',
      },
    },
    totpUsed: {
      type: String,
      required: function () {
        return this.verificationMethod === VERIFICATION_METHODS.TOTP;
      },
    },
    
    // Entry details
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Verified by is required'],
    },
    entryTime: {
      type: Date,
      default: Date.now,
      required: true,
    //  index: true,
    },
    exitTime: Date,
    
    // Additional details
    carPlateNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    numberOfPeople: {
      type: Number,
      default: 1,
      min: 1,
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    
    // Metadata
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for analytics and reporting
visitorLogSchema.index({ estateId: 1, entryTime: -1 });
visitorLogSchema.index({ residentId: 1, entryTime: -1 });
visitorLogSchema.index({ visitorType: 1, verificationMethod: 1 });
visitorLogSchema.index({ entryTime: 1, exitTime: 1 });

// Virtual for visit duration (in minutes)
visitorLogSchema.virtual('visitDuration').get(function () {
  if (!this.exitTime) return null;
  const duration = (this.exitTime - this.entryTime) / 1000 / 60; // Convert to minutes
  return Math.round(duration);
});

// Ensure virtuals are included in JSON
visitorLogSchema.set('toJSON', { virtuals: true });
visitorLogSchema.set('toObject', { virtuals: true });

// Instance method to log exit time
visitorLogSchema.methods.logExit = async function () {
  this.exitTime = new Date();
  await this.save();
};

// Instance method to check if visitor is still on premises
visitorLogSchema.methods.isOnPremises = function () {
  return !this.exitTime;
};

// Static method to get today's entries for an estate
visitorLogSchema.statics.getTodayEntries = async function (estateId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await this.find({
    estateId,
    entryTime: { $gte: today, $lt: tomorrow },
  })
    .populate('residentId', 'fullName homeAddress')
    .populate('verifiedBy', 'fullName')
    .sort({ entryTime: -1 });
};

// Static method to get visitor statistics for an estate
visitorLogSchema.statics.getEstateStats = async function (estateId, startDate, endDate) {
  return await this.aggregate([
    {
      $match: {
        estateId: new mongoose.Types.ObjectId(estateId),
        entryTime: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: '$visitorType',
        count: { $sum: 1 },
        totalPeople: { $sum: '$numberOfPeople' },
      },
    },
  ]);
};

// Static method to get recent entries for a resident
visitorLogSchema.statics.getRecentEntriesByResident = async function (residentId, limit = 10) {
  return await this.find({ residentId })
    .sort({ entryTime: -1 })
    .limit(limit)
    .populate('trustedContactId', 'fullName relationship')
    .populate('preRegisteredVisitorId', 'purpose');
};

// Static method to find visitors currently on premises
visitorLogSchema.statics.getCurrentVisitors = async function (estateId) {
  return await this.find({
    estateId,
    exitTime: null,
  })
    .populate('residentId', 'fullName homeAddress phone')
    .sort({ entryTime: -1 });
};

const VisitorLog = mongoose.model('VisitorLog', visitorLogSchema);

module.exports = VisitorLog;