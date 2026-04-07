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
        publicId: { type: String, trim: true }, // Cloudinary public_id — needed for deletion
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
  
  // Find the record with the highest reference number for the current year
  const lastEvidence = await mongoose.model("Evidence")
    .findOne({ referenceNumber: new RegExp(`^EV-${year}-`) })
    .sort("-referenceNumber")
    .exec();

  let nextNum = 1;
  if (lastEvidence && lastEvidence.referenceNumber) {
    const parts = lastEvidence.referenceNumber.split("-");
    const lastNum = parseInt(parts[2], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  this.referenceNumber = `EV-${year}-${String(nextNum).padStart(5, "0")}`;
});

// Indexes for efficient queries
evidenceSchema.index({ enforcement: 1, evidenceType: 1 });
evidenceSchema.index({ collectedBy: 1 });

module.exports = mongoose.model("Evidence", evidenceSchema);
