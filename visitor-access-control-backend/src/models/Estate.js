const mongoose = require('mongoose');

const estateSchema = new mongoose.Schema(
  {
    estateName: {
      type: String,
      required: [true, 'Estate name is required'],
      trim: true,
      maxlength: [100, 'Estate name cannot exceed 100 characters'],
    },
    estateCode: {
      type: String,
      required: [true, 'Estate code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [4, 'Username must be at least 4 characters'],
      maxlength: [20, 'Username cannot exceed 20 characters'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    address: {
      type: String,
      required: [true, 'Estate address is required'],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    contactPhone: {
      type: String,
      required: [true, 'Contact phone is required'],
      trim: true,
      match: [
        /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
        'Please provide a valid phone number',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
estateSchema.index({ isActive: 1 });
estateSchema.index({ createdAt: -1 });

// Virtual for resident count
estateSchema.virtual('residentCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'estateId',
  count: true,
});

// Ensure virtuals are included in JSON
estateSchema.set('toJSON', { virtuals: true });
estateSchema.set('toObject', { virtuals: true });

// Instance method to check if estate is active
estateSchema.methods.isEstateActive = function () {
  return this.isActive;
};

// Static method to find estate by code or username
estateSchema.statics.findByCodeOrUsername = async function (identifier) {
  return await this.findOne({
    $or: [
      { estateCode: identifier.toUpperCase() },
      { username: identifier },
    ],
    isActive: true,
  });
};

const Estate = mongoose.model('Estate', estateSchema);

module.exports = Estate;