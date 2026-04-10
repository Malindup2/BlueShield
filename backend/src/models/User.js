const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['FISHERMAN', 'ILLEGAL_ADMIN', 'HAZARD_ADMIN', 'OFFICER', 'SYSTEM_ADMIN'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please add a valid email'],
    },
    phone: {
      type: String,
      default: null,
      trim: true,
      match: [/^\+?\d{9,15}$/, 'Invalid phone number'],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 8,
      select: false, 
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'FISHERMAN',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: String,
    otpExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure unique email index
userSchema.index({ email: 1 }, { unique: true });

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);