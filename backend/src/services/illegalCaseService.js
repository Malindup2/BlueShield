const axios = require("axios");
const IllegalCase = require("../models/IllegalCase");
const Report = require("../models/Report");
const User = require("../models/User");

// External API URLs mapped by severity
// LOW uses JSONKeeper, MEDIUM/HIGH/CRITICAL use Beeceptor
const VESSEL_API_URLS = {
  LOW: "https://jsonkeeper.com/b/1EMJY",
  MEDIUM: "https://blueshield-vessels.free.beeceptor.com/vessel/medium",
  HIGH: "https://blueshield-vessels.free.beeceptor.com/vessel/high",
  CRITICAL: "https://blueshield-vessels.free.beeceptor.com/vessel/critical",
};

// Hardcoded fallback data — used ONLY if the external API call fails
const FALLBACK_DATA = {
  LOW: {
    imo: "IMO1111111",
    vesselType: "Small Fishing Boat",
    registeredOwner: "Coastal Fishermen Co",
    riskCategory: "low",
    previousViolations: 0,
  },
  MEDIUM: {
    imo: "IMO2222222",
    vesselType: "Longliner",
    registeredOwner: "Blue Ocean Pvt Ltd",
    riskCategory: "medium",
    previousViolations: 2,
  },
  HIGH: {
    imo: "IMO3333333",
    vesselType: "Bottom Trawler",
    registeredOwner: "Ocean Harvest Ltd",
    riskCategory: "high",
    previousViolations: 4,
  },
  CRITICAL: {
    imo: "IMO4444444",
    vesselType: "Industrial Trawler",
    registeredOwner: "Deep Sea Exploiters Corp",
    riskCategory: "critical",
    previousViolations: 8,
  },
};



 // get all ILLEGAL_FISHING reports.
 
exports.getPendingReports = async () => {
  const reports = await Report.find({ reportType: "ILLEGAL_FISHING" })
    .populate("reportedBy", "name email")
    .sort("-createdAt");

  const reportIds = reports.map((r) => r._id);
  const existingCases = await IllegalCase.find({
    baseReport: { $in: reportIds },
  }).select("baseReport isReviewed status");

  const caseMap = {};
  existingCases.forEach((c) => {
    caseMap[c.baseReport.toString()] = c;
  });

  return reports.map((r) => ({
    ...r.toObject(),
    illegalCase: caseMap[r._id.toString()] || null,
  }));
};


 //  Mark a pending case as reviewed

exports.markAsReviewed = async ({ reportId, actorId }) => {
  // Update the base report status to REJECTED
  const report = await Report.findById(reportId);
  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  report.status = "REJECTED";
  await report.save();

  // If an illegal case record exists for this report, mark it reviewed too
  const illegalCase = await IllegalCase.findOne({ baseReport: reportId });
  if (illegalCase) {
    illegalCase.isReviewed = true;
    await illegalCase.save();
    return { report, illegalCase };
  }

  // If no case record exists yet, just return the updated report
  return { report, illegalCase: null };
};

// remove reviewed case

exports.deleteReviewedCase = async ({ reportId }) => {
  const report = await Report.findById(reportId);
  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  // Remove the associated illegal case record if it exists
  const illegalCase = await IllegalCase.findOneAndDelete({ baseReport: reportId });

  return { reportId, illegalCaseId: illegalCase ? illegalCase._id : null };
};