const mongoose = require("mongoose")
// Evidence types for chain of custody tracking
const EVIDENCE_TYPES = ["PHOTOGRAPH", "VIDEO", "DOCUMENT", "PHYSICAL_ITEM", "TESTIMONY", "DIGITAL_LOG"];
const EVIDENCE_CONDITIONS = ["INTACT", "DAMAGED", "DETERIORATED", "SEALED"];

const evidenceSchema = new mongoose.Schema(
  {
    enforcement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enforcement",
      required: true,
      index: true,
    },
    referenceNumber: {
      type: String,
      unique: true,
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
      required: true,
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
  { timestamps: true }
);

// Auto-generate reference number before save
evidenceSchema.pre("save", async function () {
  if (!this.isNew || this.referenceNumber) return;
  const year = new Date().getFullYear();
  const count = await mongoose.model("Evidence").countDocuments();
  this.referenceNumber = `EV-${year}-${String(count + 1).padStart(5, "0")}`;
});

// Indexes for efficient queries
evidenceSchema.index({ enforcement: 1, evidenceType: 1 });
evidenceSchema.index({ collectedBy: 1 });

module.exports = mongoose.model("Evidence", evidenceSchema);
