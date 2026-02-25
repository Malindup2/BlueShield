const mongoose = require("mongoose");

// ============================================================================
// ENFORCEMENT MODEL - Maritime Law Enforcement Case Management
// ============================================================================
// This model tracks enforcement actions taken against illegal fishing cases.
// It supports: actions logging, evidence chain-of-custody, team assignment,
// AI risk assessment, and full case lifecycle management.
// ============================================================================

// ----- ENUMS -----
const ACTION_TYPES = ["INSPECTION", "FINE_ISSUED", "WARNING", "ARREST", "SEIZURE"];
const ENF_STATUS = ["OPEN", "COURT_PENDING", "CLOSED_RESOLVED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const OUTCOMES = ["PENDING", "WARNING_ISSUED", "FINE_COLLECTED", "EQUIPMENT_SEIZED", "VESSEL_SEIZED", "ARREST_MADE", "CASE_DISMISSED"];

// Evidence types for chain of custody tracking
const EVIDENCE_TYPES = ["PHOTOGRAPH", "VIDEO", "DOCUMENT", "PHYSICAL_ITEM", "TESTIMONY", "DIGITAL_LOG"];
const EVIDENCE_CONDITIONS = ["INTACT", "DAMAGED", "DETERIORATED", "SEALED"];

// Team member roles for multi-officer operations
const TEAM_ROLES = ["LEAD", "SUPPORT", "INVESTIGATOR", "LEGAL_LIAISON", "FORENSICS"];

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

// ============================================================================
// EVIDENCE SCHEMA - Chain of Custody Tracking
// ============================================================================
// Comprehensive evidence management for legal proceedings.
// Tracks: collection, storage, verification, and chain of custody.
// ============================================================================
const evidenceSchema = new mongoose.Schema(
  {
    // Auto-generated reference number for evidence tracking
    referenceNumber: {
      type: String,
      trim: true,
    },
    // Type of evidence collected
    evidenceType: {
      type: String,
      enum: EVIDENCE_TYPES,
      required: [true, "Evidence type is required"],
    },
    // Detailed description of the evidence item
    description: {
      type: String,
      trim: true,
      required: [true, "Evidence description is required"],
      maxlength: 500,
    },
    // Physical storage location for chain of custody
    storageLocation: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    // Method used to collect the evidence
    collectionMethod: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    // Current condition of the evidence
    condition: {
      type: String,
      enum: EVIDENCE_CONDITIONS,
      default: "INTACT",
    },
    // Whether evidence is in a sealed container/bag
    isSealed: {
      type: Boolean,
      default: false,
    },
    // Seal identification number for tamper detection
    sealNumber: {
      type: String,
      trim: true,
    },
    // Officer who collected the evidence
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Timestamp when evidence was collected
    collectedAt: {
      type: Date,
      default: Date.now,
    },
    // Officer who verified evidence authenticity
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Timestamp when evidence was verified
    verifiedAt: {
      type: Date,
      default: null,
    },
    // File attachments (photos, documents, etc.)
    attachments: [
      {
        url: { type: String, trim: true },
        filename: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    // Additional notes about the evidence
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: true, timestamps: true }
);

// Track every AI risk assessment (history)
const riskAssessmentSchema = new mongoose.Schema(
  {
    riskScore: { type: Number, min: 0, max: 100, required: true },
    riskLevel: { type: String, enum: ["LOW", "MODERATE", "HIGH", "CRITICAL"], required: true },
    justification: { type: String, default: "" },
    recommendedActions: [{ type: String }],
    provider: { type: String, default: "Gemini-2.0-flash" },
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
    
    // Array of enforcement actions taken (inspections, fines, arrests, etc.)
    actions: [actionSchema],

    // Array of evidence items with chain of custody tracking
    evidence: [evidenceSchema],

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

    // Full history of AI risk assessments
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

enforcementSchema.index({ status: 1 });
enforcementSchema.index({ leadOfficer: 1 });
enforcementSchema.index({ priority: 1, status: 1 });
enforcementSchema.index({ outcome: 1 });

module.exports = mongoose.model("Enforcement", enforcementSchema);
