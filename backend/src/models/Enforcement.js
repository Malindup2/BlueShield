const mongoose = require("mongoose");

const ACTION_TYPES = ["INSPECTION", "FINE_ISSUED", "WARNING", "ARREST", "SEIZURE"];
const ENF_STATUS = ["OPEN", "COURT_PENDING", "CLOSED_RESOLVED"];

const actionSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: ACTION_TYPES,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      min: 0,
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
    attachments: [
      {
        url: String,
        type: String,
      },
    ],
  },
  { _id: true }
);

const enforcementSchema = new mongoose.Schema(
  {
    relatedCase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "IllegalCase",
      required: true,
      unique: true,
    },
    leadOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ENF_STATUS,
      default: "OPEN",
    },
    actions: [actionSchema],
    aiRiskScore: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    aiJustification: {
      type: String,
      default: null,
    },
    aiProvider: {
      type: String,
      default: null,
    },
    aiFetchedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

enforcementSchema.index({ status: 1 });
enforcementSchema.index({ leadOfficer: 1 });

module.exports = mongoose.model("Enforcement", enforcementSchema);
