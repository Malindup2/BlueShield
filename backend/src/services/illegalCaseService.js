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

// ILLEGAL CASE REVIEW RECORD

 // Creates a new illegal case review record from a pending ILLEGAL_FISHING report.

exports.createCase = async ({ reportId, payload, actorId }) => {
  const report = await Report.findById(reportId);
  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }
  if (report.reportType !== "ILLEGAL_FISHING") {
    const err = new Error("Only ILLEGAL_FISHING reports can be reviewed here");
    err.statusCode = 400;
    throw err;
  }

  const existing = await IllegalCase.findOne({ baseReport: reportId });
  if (existing) {
    const err = new Error("An illegal case review record already exists for this report");
    err.statusCode = 409;
    throw err;
  }

  const newCase = await IllegalCase.create({
    baseReport: reportId,
    title: payload.title,
    description: payload.description,
    vesselId: payload.vesselId,      // stored as "IMO-XXXXXXX" format
    vesselType: payload.vesselType,
    severity: payload.severity,
    status: "OPEN",                  // always starts as OPEN
    assignedOfficer: null,           // no officer assigned at creation
    createdBy: actorId,
  });

  return newCase;
};


 // Updates an existing illegal case review record.
 
exports.updateCase = async ({ caseId, payload, actorId }) => {
  const illegalCase = await IllegalCase.findById(caseId);
  if (!illegalCase) {
    const err = new Error("Illegal case not found");
    err.statusCode = 404;
    throw err;
  }

  if (illegalCase.status !== "OPEN") {
    const err = new Error("Record can only be updated when status is OPEN");
    err.statusCode = 403;
    throw err;
  }

  // Only allow updating these fields — status and officer are not editable here
  const allowedUpdates = ["title", "description", "vesselId", "vesselType", "severity"];
  allowedUpdates.forEach((field) => {
    if (payload[field] !== undefined) {
      illegalCase[field] = payload[field];
    }
  });

  await illegalCase.save();
  return illegalCase;
};


 // Returns all illegal case review records 

exports.listCases = async ({ query }) => {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.severity) filter.severity = query.severity;

  const sort = query.sort || "-createdAt";

  const [items, total] = await Promise.all([
    IllegalCase.find(filter)
      .populate("baseReport", "title reportType reportedBy")
      .populate("createdBy", "name email")
      .populate("assignedOfficer", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    IllegalCase.countDocuments(filter),
  ]);

  return { page, limit, total, items };
};

// get details of a single illegal case review record.

exports.getCaseById = async (caseId) => {
  const doc = await IllegalCase.findById(caseId)
    .populate("baseReport")
    .populate("createdBy", "name email role")
    .populate("assignedOfficer", "name email role")
    .populate("escalatedBy", "name email");

  if (!doc) {
    const err = new Error("Illegal case not found");
    err.statusCode = 404;
    throw err;
  }
  return doc;
};


 // Deletes an illegal case review record.
 
exports.deleteCase = async ({ caseId }) => {
  const illegalCase = await IllegalCase.findById(caseId);
  if (!illegalCase) {
    const err = new Error("Illegal case not found");
    err.statusCode = 404;
    throw err;
  }

  if (illegalCase.status === "ESCALATED") {
    const err = new Error(
      "Cannot delete a record while it is escalated."
    );
    err.statusCode = 403;
    throw err;
  }

  await IllegalCase.findByIdAndDelete(caseId);
  return { id: caseId };
};

// get all users with role OFFICER for the assign officer 
 
exports.getOfficers = async () => {
  const officers = await User.find({ role: "OFFICER", isActive: true }).select(
    "name email role"
  );
  return officers;
};

// escalating the case for the specific officer and update status

exports.escalateCase = async ({ caseId, officerId, actorId }) => {
  const illegalCase = await IllegalCase.findById(caseId);
  if (!illegalCase) {
    const err = new Error("Illegal case not found");
    err.statusCode = 404;
    throw err;
  }

  // Block if already escalated or resolved
  if (illegalCase.status === "ESCALATED") {
    const err = new Error("Case is already escalated");
    err.statusCode = 409;
    throw err;
  }
  if (illegalCase.status === "RESOLVED") {
    const err = new Error("Cannot escalate a resolved case");
    err.statusCode = 403;
    throw err;
  }

  // Check vessel tracking was done first
  if (!illegalCase.trackButtonUsed) {
    const err = new Error("Please track the vessel data before escalating the case");
    err.statusCode = 400;
    throw err;
  }

  // Check officer is provided
  if (!officerId) {
    const err = new Error("Please assign an officer to escalate the case further");
    err.statusCode = 400;
    throw err;
  }

  // Verify the officer exists and has the correct role
  const officer = await User.findById(officerId);
  if (!officer || officer.role !== "OFFICER") {
    const err = new Error("Selected user is not a valid officer");
    err.statusCode = 400;
    throw err;
  }

  // Perform escalation
  illegalCase.assignedOfficer = officerId;
  illegalCase.status = "ESCALATED";
  illegalCase.escalatedAt = new Date();
  illegalCase.escalatedBy = actorId;
  await illegalCase.save();

  // Populate and return
  const populated = await IllegalCase.findById(caseId)
    .populate("assignedOfficer", "name email role")
    .populate("escalatedBy", "name email");

  return populated;
};