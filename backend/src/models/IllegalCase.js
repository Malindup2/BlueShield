const mongoose = require("mongoose");

// statuses 
const CASE_STATUSES = ["OPEN", "ESCALATED", "RESOLVED"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const illegalCaseSchema = new mongoose.Schema(
  {
    caseNumber: {
      type: String,
      unique: true,
    },
    // Reference to the original fisherman reported incident (ILLEGAL FISHING type)
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
    // Officer assigned via escalate action (only set when admin escalates the case — null until then)
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Tracks whether the 'track' has been used (can only used once)
    trackButtonUsed: {
      type: Boolean,
      default: false,
    },
    // Stores the fetched vessel data from external API permanently
    trackedVesselData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Reference notes 
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
    // set to true automatically when status is reviewed
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
  if (!this.isNew || this.caseNumber) return;
  
  // Use a combination of timestamp and a robust sequential increment
  const timestamp = Date.now();
  const lastCase = await mongoose.model("IllegalCase")
    .findOne()
    .sort("-createdAt")
    .exec();

  let nextNum = 1;
  if (lastCase && lastCase.caseNumber) {
    const parts = lastCase.caseNumber.split("-");
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextNum = lastSeq + 1;
    }
  }

  this.caseNumber = `IC-${timestamp}-${String(nextNum).padStart(5, "0")}`;
});

illegalCaseSchema.index({ status: 1, severity: 1 });
illegalCaseSchema.index({ baseReport: 1 }, { unique: true }); // One review record per report

module.exports = mongoose.model("IllegalCase", illegalCaseSchema);