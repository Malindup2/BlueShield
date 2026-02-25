const mongoose = require("mongoose");


// ENFORCEMENT MODEL - Maritime Law Enforcement Case Management


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

// EVIDENCE SCHEMA - Chain of Custody Tracking
const evidenceSchema = new mongoose.Schema(
  {
    referenceNumber: {
      type: String,
      trim: true,
    },
    evidenceType: {
      type: String,
      enum: EVIDENCE_TYPES,
      required: [true, "Evidence type is required"],
    },
    description: {
      type: String,
      trim: true,
      required: [true, "Evidence description is required"],
      maxlength: 500,
    },
    storageLocation: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    collectionMethod: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    condition: {
      type: String,
      enum: EVIDENCE_CONDITIONS,
      default: "INTACT",
    },
    isSealed: {
      type: Boolean,
      default: false,
    },
    sealNumber: {
      type: String,
      trim: true,
    },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    collectedAt: {
      type: Date,
      default: Date.now,
    },
    
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    
    verifiedAt: {
      type: Date,
      default: null,
    },
   
    attachments: [
      {
        url: { type: String, trim: true },
        filename: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    
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


// TEAM MEMBER SCHEMA - Multi-Officer Operations

const teamMemberSchema = new mongoose.Schema(
  {
    
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Officer is required"],
    },
    
    role: {
      type: String,
      enum: TEAM_ROLES,
      required: [true, "Team role is required"],
    },
    
    status: {
      type: String,
      enum: ["ACTIVE", "ON_LEAVE", "REASSIGNED"],
      default: "ACTIVE",
    },
    
    department: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    
    specialization: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    
    badgeNumber: {
      type: String,
      trim: true,
    },
    
    contactNumber: {
      type: String,
      trim: true,
    },
    
    hoursLogged: {
      type: Number,
      min: 0,
      default: 0,
    },
    
    responsibilities: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    
    relievedAt: {
      type: Date,
      default: null,
    },
    
    relievedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: true, timestamps: true }
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

    // Array of team members assigned to this enforcement
    assignedTeam: [teamMemberSchema],

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
