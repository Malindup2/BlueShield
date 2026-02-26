const mongoose = require("mongoose");
// ----- ENUMS -----
const ACTION_TYPES = ["INSPECTION", "FINE_ISSUED", "WARNING", "ARREST", "SEIZURE"];
const ENF_STATUS = ["OPEN", "COURT_PENDING", "CLOSED_RESOLVED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const OUTCOMES = ["PENDING", "WARNING_ISSUED", "FINE_COLLECTED", "EQUIPMENT_SEIZED", "VESSEL_SEIZED", "ARREST_MADE", "CASE_DISMISSED"];


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


const riskAssessmentSchema = new mongoose.Schema(
  {
    riskScore: { type: Number, min: 0, max: 100, required: true },
    riskLevel: { type: String, enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"], required: true },
    justification: { type: String, default: "" },
    recommendedActions: [{ type: String }],
    provider: { type: String, default: "Gemini-2.5-flash" },
    assessedAt: { type: Date, default: Date.now },
    assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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
    priority: {
      type: String,
      enum: PRIORITIES,
      default: "MEDIUM",
    },
    outcome: {
      type: String,
      enum: OUTCOMES,
      default: "PENDING",
    },

    // Embedded array of enforcement actions (inspections, fines, arrests, etc.)
    actions: [actionSchema],

    // Latest AI risk score (quick access)
    aiRiskScore: {
      type: Number,
      min: 0,
      max: 100,
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

    // Embedded history of AI risk assessments
    riskScoreHistory: [riskAssessmentSchema],

    // Court & penalty tracking
    penaltyAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    courtDate: {
      type: Date,
      default: null,
    },
    courtReference: {
      type: String,
      trim: true,
      default: null,
    },

    // Closure tracking
    closedAt: {
      type: Date,
      default: null,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

// Indexes for efficient queries
enforcementSchema.index({ status: 1 });
enforcementSchema.index({ leadOfficer: 1 });
enforcementSchema.index({ priority: 1, status: 1 });
enforcementSchema.index({ outcome: 1 });

module.exports = mongoose.model("Enforcement", enforcementSchema);
