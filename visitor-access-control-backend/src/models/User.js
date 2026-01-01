const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true,
      match: [
        /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
        'Please provide a valid phone number',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: '{VALUE} is not a valid role',
      },
      default: ROLES.RESIDENT,
      index: true,
    },

    // Resident-specific fields
    homeAddress: {
      type: String,
      trim: true,
      required: function () {
        return this.role === ROLES.RESIDENT;
      },
    },
    estateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Estate',
      required: function () {
        return this.role === ROLES.RESIDENT;
      },
      index: true,
    },
    estateCode: {
      type: String,
      uppercase: true,
      trim: true,
      required: function () {
        return this.role === ROLES.RESIDENT;
      },
    },
    acceptingVisitors: {
      type: Boolean,
      default: true,
    },

    // Security-specific fields
    assignedEstateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Estate',
      required: function () {
        return this.role === ROLES.SECURITY;
      },
    },

    // Account management
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
userSchema.index({ role: 1, estateId: 1 });
userSchema.index({ isActive: 1, isVerified: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to check if user can accept visitors
userSchema.methods.canAcceptVisitors = function () {
  return this.role === ROLES.RESIDENT && this.acceptingVisitors && this.isActive;
};

// Static method to find active residents by estate
userSchema.statics.findResidentsByEstate = async function (estateId) {
  return await this.find({
    role: ROLES.RESIDENT,
    estateId,
    isActive: true,
  }).select('-password');
};

// Virtual for full profile
userSchema.virtual('profile').get(function () {
  return {
    id: this._id,
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    role: this.role,
  };
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;