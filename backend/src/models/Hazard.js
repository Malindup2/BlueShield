const mongoose = require("mongoose");

const HANDLING_STATUS = [
  "OPEN",
  "MONITORING",
  "MITIGATION_PLANNED",
  "MITIGATION_IN_PROGRESS",
  "RESOLVED",
];

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const HAZARD_CATEGORIES = ["WEATHER", "POLLUTION", "DEBRIS", "OBSTRUCTION", "OTHER"];
const RISK_LEVELS = ["LOW", "MODERATE", "HIGH"];

const hazardSchema = new mongoose.Schema(
  {
    caseId: { type: String, required: true, unique: true, index: true, trim: true },

    baseReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
      unique: true,
      index: true,
    },

    hazardCategory: { type: String, enum: HAZARD_CATEGORIES, default: "OTHER", index: true },
    severity: { type: String, enum: SEVERITIES, default: "MEDIUM", index: true },

    handlingStatus: { type: String, enum: HANDLING_STATUS, default: "OPEN", index: true },

    zoneRequired: { type: Boolean, default: false, index: true },

    resolutionNote: { type: String, trim: true, default: null, maxlength: 600 },
    resolvedAt: { type: Date, default: null },

    lastWeatherCheck: {
      fetchedAt: { type: Date, default: null },
      provider: { type: String, default: "Open-Meteo Marine API" },
      waveHeight: { type: Number, default: null },
      windWaveHeight: { type: Number, default: null }, // ✅ replaced windSpeed
      seaTemperature: { type: Number, default: null },
      timestamp: { type: String, default: null },
      riskLevel: { type: String, enum: RISK_LEVELS, default: null },
      advisory: { type: String, default: null, maxlength: 300 },
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

hazardSchema.index({ handlingStatus: 1, hazardCategory: 1, severity: 1 });

module.exports = mongoose.model("Hazard", hazardSchema);