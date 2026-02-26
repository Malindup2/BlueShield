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
      required: [true, "Officer is required"],
    },
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
    responsibilities: [{
      type: String,
      trim: true,
    }],
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

// Prevent duplicate officer assignment to same enforcement
teamMemberSchema.index({ enforcement: 1, officer: 1 }, { unique: true });

// Indexes for efficient queries
teamMemberSchema.index({ enforcement: 1, role: 1 });
teamMemberSchema.index({ officer: 1 });
teamMemberSchema.index({ status: 1 });

module.exports = mongoose.model("TeamMember", teamMemberSchema);
