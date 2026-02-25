const mongoose = require("mongoose");

const REPORT_TYPES = ["ILLEGAL_FISHING", "HAZARD", "ENVIRONMENTAL", "OTHER"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Report title is required"],
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    reportType: {
      type: String,
      enum: REPORT_TYPES,
      default: "OTHER",
    },

    severity: {
      type: String,
      enum: SEVERITIES,
      default: "MEDIUM",
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },

      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },

      address: {
        type: String,
        trim: true,
      },
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "RESOLVED"],
      default: "PENDING",
    },

    attachments: [
      {
        url: String,
        type: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

reportSchema.index({ location: "2dsphere" });
reportSchema.index({ reportType: 1, status: 1 });

module.exports = mongoose.model("Report", reportSchema);
//push test
//push test