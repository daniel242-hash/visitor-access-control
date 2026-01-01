const mongoose = require('mongoose');
const { RELATIONSHIP_TYPES } = require('../config/constants');
const crypto = require('crypto');

const trustedContactSchema = new mongoose.Schema(
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
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      index: true,
      match: [
        /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
        'Please provide a valid phone number',
      ],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required'],
      enum: {
        values: RELATIONSHIP_TYPES,
        message: '{VALUE} is not a valid relationship type',
      },
    },
    
    // TOTP Configuration
    totpSecret: {
      type: String,
      required: [true, 'TOTP secret is required'],
      select: false, // Don't return secret by default
    },
    totpEnabled: {
      type: Boolean,
      default: true,
    },
    
    // Access Token for unique link
    accessToken: {
      type: String,
      unique: true,
      //index: true,
      sparse: true, // Allow null during creation, but enforce uniqueness when present
    },
    
    // Additional info
    profilePhoto: {
      type: String, // URL to photo storage
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Usage tracking
    lastUsed: Date,
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
trustedContactSchema.index({ residentId: 1, estateId: 1 });
trustedContactSchema.index({ phone: 1, estateId: 1 });
trustedContactSchema.index({ isActive: 1, totpEnabled: 1 });

// Prevent duplicate phone numbers for the same resident
trustedContactSchema.index(
  { residentId: 1, phone: 1 },
  { unique: true }
);

// Pre-save hook to generate access token if not exists
trustedContactSchema.pre('save', function (next) {
  if (this.isNew && !this.accessToken) {
    this.accessToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Instance method to check if contact can generate TOTP
trustedContactSchema.methods.canGenerateTOTP = function () {
  return this.isActive && this.totpEnabled;
};

// Instance method to increment usage count
trustedContactSchema.methods.recordUsage = async function () {
  this.lastUsed = new Date();
  this.usageCount += 1;
  await this.save();
};

// Static method to find active contacts for a resident
trustedContactSchema.statics.findActiveContactsByResident = async function (residentId) {
  return await this.find({
    residentId,
    isActive: true,
    totpEnabled: true,
  }).select('-totpSecret');
};

// Static method to find contact by phone and estate
trustedContactSchema.statics.findByPhoneAndEstate = async function (phone, estateId) {
  return await this.findOne({
    phone,
    estateId,
    isActive: true,
    totpEnabled: true,
  }).select('+totpSecret');
};

const TrustedContact = mongoose.model('TrustedContact', trustedContactSchema);

module.exports = TrustedContact;