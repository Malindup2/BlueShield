const mongoose = require("mongoose");
// Team member roles for multi-officer operations
const TEAM_ROLES = ["LEAD_INVESTIGATOR", "INVESTIGATOR", "EVIDENCE_HANDLER", "SURVEILLANCE", "LEGAL_LIAISON", "SUPPORT"];
const TEAM_STATUS = ["ACTIVE", "ON_LEAVE", "RELIEVED"];

const teamMemberSchema = new mongoose.Schema(
  {
    enforcement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enforcement",
      required: true,
      index: true,
    },
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    badgeNumber: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    responsibilities: [{
      type: String,
      trim: true,
    }],
    role: {
      type: String,
      enum: TEAM_ROLES,
      required: [true, "Team role is required"],
    },
    status: {
      type: String,
      enum: TEAM_STATUS,
      default: "ACTIVE",
    },
    specialization: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    hoursLogged: {
      type: Number,
      min: 0,
      default: 0,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  { timestamps: true }
);

// Prevent duplicate assignment of the SAME registered officer to the same enforcement
// Allows multiple "Direct" members (where officer is null) to co-exist on the same case
teamMemberSchema.index(
  { enforcement: 1, officer: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { officer: { $exists: true, $ne: null } } 
  }
);
teamMemberSchema.index({ enforcement: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });

// Indexes for efficient queries
teamMemberSchema.index({ enforcement: 1, role: 1 });
teamMemberSchema.index({ officer: 1 });
teamMemberSchema.index({ email: 1 });
teamMemberSchema.index({ status: 1 });

module.exports = mongoose.model("TeamMember", teamMemberSchema);
