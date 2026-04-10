const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: String,
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'FISHERMAN',
    },
    otp: {
      type: String,
      required: true,
    },
    otpExpire: {
      type: Date,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900, // Automatically delete after 15 minutes (900 seconds)
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PendingUser', pendingUserSchema);
