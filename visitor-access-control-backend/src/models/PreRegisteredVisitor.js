const mongoose = require('mongoose');
const {
  VISITOR_STATUS,
  COMPLEXION_OPTIONS,
  VISIT_PURPOSES,
} = require('../config/constants');

const preRegisteredVisitorSchema = new mongoose.Schema(
  {
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Resident ID is required'],
      index: true,
    },
    estateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Estate',
      required: [true, 'Estate ID is required'],
      index: true,
    },
    
    // Visitor details
    visitorName: {
      type: String,
      required: [true, 'Visitor name is required'],
      trim: true,
      maxlength: [100, 'Visitor name cannot exceed 100 characters'],
    },
    visitorPhone: {
      type: String,
      required: [true, 'Visitor phone is required'],
      trim: true,
      index: true,
      match: [
        /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
        'Please provide a valid phone number',
      ],
    },
    carPlateNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    numberOfPeople: {
      type: Number,
      default: 1,
      min: [1, 'Number of people must be at least 1'],
      max: [50, 'Number of people cannot exceed 50'],
    },
    complexion: {
      type: String,
      enum: {
        values: COMPLEXION_OPTIONS,
        message: '{VALUE} is not a valid complexion option',
      },
    },
    purpose: {
      type: String,
      required: [true, 'Visit purpose is required'],
      enum: {
        values: VISIT_PURPOSES,
        message: '{VALUE} is not a valid visit purpose',
      },
    },
    additionalNotes: {
      type: String,
      maxlength: [500, 'Additional notes cannot exceed 500 characters'],
    },
    
    // Visit scheduling - DATE ONLY (no time field)
    expectedArrivalDate: {
      type: Date,
      required: [true, 'Expected arrival date is required'],
      index: true,
    },
    
    validUntil: {
      type: Date,
      required: true,
      //index: true,
    },
    
    // ✅ NEW: Early arrival permission
    allowEarlyArrival: {
      type: Boolean,
      default: false,
      index: true,
    },
    
    // Status tracking
    status: {
      type: String,
      enum: {
        values: Object.values(VISITOR_STATUS),
        message: '{VALUE} is not a valid status',
      },
      default: VISITOR_STATUS.PENDING,
      index: true,
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    denialReason: String,
    
    // Notification tracking
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationSentAt: Date,
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Compound indexes
preRegisteredVisitorSchema.index({ residentId: 1, status: 1 });
preRegisteredVisitorSchema.index({ estateId: 1, expectedArrivalDate: 1 });
preRegisteredVisitorSchema.index({ status: 1, validUntil: 1 });
preRegisteredVisitorSchema.index({ visitorPhone: 1, estateId: 1, status: 1 });

// TTL index - Automatically delete documents after validUntil expires
preRegisteredVisitorSchema.index({ validUntil: 1 }, { expireAfterSeconds: 0 });

// Automatically set validUntil to end of expectedArrivalDate
preRegisteredVisitorSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('expectedArrivalDate')) {
    if (this.expectedArrivalDate) {
      const endOfDay = new Date(this.expectedArrivalDate);
      endOfDay.setHours(23, 59, 59, 999);
      this.validUntil = endOfDay;
    }
  }
  next();
});

// Instance method to check if visitor registration is still valid
preRegisteredVisitorSchema.methods.isValid = function () {
  return (
    this.status === VISITOR_STATUS.PENDING &&
    new Date() <= this.validUntil
  );
};

// Instance method to check if visitor is expected today
preRegisteredVisitorSchema.methods.isExpectedToday = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expectedDate = new Date(this.expectedArrivalDate);
  expectedDate.setHours(0, 0, 0, 0);
  
  return today.getTime() === expectedDate.getTime();
};

// ✅ NEW: Instance method to check if visitor can enter today
preRegisteredVisitorSchema.methods.canEnterToday = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expectedDate = new Date(this.expectedArrivalDate);
  expectedDate.setHours(0, 0, 0, 0);
  
  const isToday = today.getTime() === expectedDate.getTime();
  const isBeforeExpectedDate = today < expectedDate;
  
  // Can enter if it's today, or if arriving early and allowed
  return isToday || (isBeforeExpectedDate && this.allowEarlyArrival);
};

// Instance method to mark as verified
preRegisteredVisitorSchema.methods.markAsVerified = async function (verifiedById) {
  this.status = VISITOR_STATUS.VERIFIED;
  this.verifiedAt = new Date();
  this.verifiedBy = verifiedById;
  await this.save();
};

// Instance method to mark as denied
preRegisteredVisitorSchema.methods.markAsDenied = async function (reason) {
  this.status = VISITOR_STATUS.DENIED;
  this.denialReason = reason;
  await this.save();
};

// Static method to manually delete expired registrations (backup to TTL)
preRegisteredVisitorSchema.statics.deleteExpired = async function () {
  const result = await this.deleteMany({
    validUntil: { $lt: new Date() },
  });
  return result.deletedCount;
};

// Static method to find pending visitors for a resident
preRegisteredVisitorSchema.statics.findPendingByResident = async function (residentId) {
  return await this.find({
    residentId,
    status: VISITOR_STATUS.PENDING,
    validUntil: { $gte: new Date() },
  }).sort({ expectedArrivalDate: 1 });
};

// Static method to search visitors by phone and estate
preRegisteredVisitorSchema.statics.searchByPhoneAndEstate = async function (phone, estateId) {
  const normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '');
  const phoneVariations = [phone, normalizedPhone, phone.trim()];
  
  return await this.find({
    visitorPhone: { $in: phoneVariations },
    estateId,
    status: VISITOR_STATUS.PENDING,
    validUntil: { $gte: new Date() },
  }).populate('residentId', 'fullName phone homeAddress acceptingVisitors');
};

// Static method to get today's expected visitors for an estate
preRegisteredVisitorSchema.statics.getTodaysVisitors = async function (estateId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return await this.find({
    estateId,
    status: VISITOR_STATUS.PENDING,
    expectedArrivalDate: {
      $gte: today,
      $lt: tomorrow,
    },
  }).populate('residentId', 'fullName homeAddress phone');
};

const PreRegisteredVisitor = mongoose.model('PreRegisteredVisitor', preRegisteredVisitorSchema);

module.exports = PreRegisteredVisitor;