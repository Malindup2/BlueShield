const mongoose = require("mongoose");

const CASE_STATUSES = ["OPEN", "INVESTIGATING", "COURT_PENDING", "CLOSED_RESOLVED", "CLOSED_DISMISSED"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const illegalCaseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      unique: true,
    },
    baseReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Case title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
    },
    severity: {
      type: String,
      enum: SEVERITIES,
      default: "MEDIUM",
    },
    status: {
      type: String,
      enum: CASE_STATUSES,
      default: "OPEN",
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    suspects: [
      {
        name: String,
        identification: String,
        description: String,
        addedAt: { type: Date, default: Date.now },
      },
    ],
    evidence: [
      {
        description: String,
        url: String,
        type: String,
        collectedAt: { type: Date, default: Date.now },
        collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    notes: [
      {
        content: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    closedAt: {
      type: Date,
      default: null,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-generate case number before save
illegalCaseSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  const count = await mongoose.model("IllegalCase").countDocuments();
  this.caseNumber = `IC-${Date.now()}-${String(count + 1).padStart(5, "0")}`;
  next();
});

illegalCaseSchema.index({ status: 1, severity: 1 });

module.exports = mongoose.model("IllegalCase", illegalCaseSchema);
