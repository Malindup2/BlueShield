const mongoose = require("mongoose");

// New statuses 
const CASE_STATUSES = ["OPEN", "ESCALATED", "RESOLVED"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const illegalCaseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      unique: true,
    },
    // Reference to the original fisherman-reported incident (ILLEGAL_FISHING type)
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
      required: [true, "Description is required"],
    },
    severity: {
      type: String,
      enum: SEVERITIES,
      default: "MEDIUM",
      required: true,
    },
    status: {
      type: String,
      enum: CASE_STATUSES,
      default: "OPEN",
    },
    // Vessel information fields
    vesselId: {
      type: String, // Stored as "IMO-XXXXXXX"
      trim: true,
      required: [true, "Vessel ID is required"],
    },
    vesselType: {
      type: String,
      trim: true,
      required: [true, "Vessel type is required"],
    },
    // Officer assigned via escalate action (ObjectId ref to User with role OFFICER)
    // Only set when admin escalates the case — null until then
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Tracks whether the 'track' button has been used (can only be clicked once)
    trackButtonUsed: {
      type: Boolean,
      default: false,
    },
    // Stores the fetched vessel data from external API permanently
    trackedVesselData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Reference notes added by admin in the third section of the details page
    reviewNotes: [
      {
        content: {
          type: String,
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Whether the base report has been "marked as reviewed" in the dashboard
    // Also set to true automatically when status becomes RESOLVED
    isReviewed: {
      type: Boolean,
      default: false,
    },
    // Set when the case is escalated
    escalatedAt: {
      type: Date,
      default: null,
    },
    escalatedBy: {
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
illegalCaseSchema.pre("save", async function () {
  if (!this.isNew) return;
  const count = await mongoose.model("IllegalCase").countDocuments();
  this.caseNumber = `IC-${Date.now()}-${String(count + 1).padStart(5, "0")}`;
});

illegalCaseSchema.index({ status: 1, severity: 1 });
illegalCaseSchema.index({ baseReport: 1 }, { unique: true }); // One review record per report

module.exports = mongoose.model("IllegalCase", illegalCaseSchema);