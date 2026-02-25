const mongoose = require("mongoose");

const ZONE_STATUS = ["ACTIVE", "DISABLED"];
const ZONE_TYPES = ["RESTRICTED", "DANGEROUS"];

const zoneSchema = new mongoose.Schema(
  {
    sourceHazard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hazard",
      required: true,
      unique: true,
      index: true,
    },

    warningMessage: {
      type: String,
      required: [true, "warningMessage is required"],
      trim: true,
      maxlength: 400,
    },

    zoneType: {
      type: String,
      enum: ZONE_TYPES,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ZONE_STATUS,
      default: "ACTIVE",
      index: true,
    },

    center: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true },
    },

    radius: { type: Number, required: true, min: 10, max: 50000 },

    expiresAt: { type: Date, default: null, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

zoneSchema.index({ center: "2dsphere" });
zoneSchema.index({ status: 1, zoneType: 1 });

module.exports = mongoose.model("Zone", zoneSchema);