const axios = require("axios");
const IllegalCase = require("../models/IllegalCase");
const Report = require("../models/Report");
const User = require("../models/User");

const VESSEL_API_URLS = {
  LOW: "https://jsonkeeper.com/b/1EMJY",
  MEDIUM: "https://blueshield-vessels.free.beeceptor.com/vessel/medium",
  HIGH: "https://blueshield-vessels.free.beeceptor.com/vessel/high",
  CRITICAL: "https://blueshield-vessels.free.beeceptor.com/vessel/critical",
};

const FALLBACK_DATA = {
  LOW: { imo: "IMO1111111", vesselType: "Small Fishing Boat", registeredOwner: "Coastal Fishermen Co", riskCategory: "low", previousViolations: 0 },
  MEDIUM: { imo: "IMO2222222", vesselType: "Longliner", registeredOwner: "Blue Ocean Pvt Ltd", riskCategory: "medium", previousViolations: 2 },
  HIGH: { imo: "IMO3333333", vesselType: "Bottom Trawler", registeredOwner: "Ocean Harvest Ltd", riskCategory: "high", previousViolations: 4 },
  CRITICAL: { imo: "IMO4444444", vesselType: "Industrial Trawler", registeredOwner: "Deep Sea Exploiters Corp", riskCategory: "critical", previousViolations: 8 },
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

exports.getPendingReports = async () => {
  const reports = await Report.find({ reportType: "ILLEGAL_FISHING" })
    .populate("reportedBy", "name email")
    .sort("-createdAt");

  const reportIds = reports.map((r) => r._id);
  const existingCases = await IllegalCase.find({ baseReport: { $in: reportIds } })
    .select("baseReport isReviewed status");

  const caseMap = {};
  existingCases.forEach((c) => { caseMap[c.baseReport.toString()] = c; });

  return reports.map((r) => ({ ...r.toObject(), illegalCase: caseMap[r._id.toString()] || null }));
};

/**
 * FIX: Use findByIdAndUpdate instead of report.save() to avoid Mongoose
 * CastError caused by the attachments subdocument having a field named "type"
 * which conflicts with Mongoose's reserved schema keyword.
 * runValidators: false ensures only the status field is validated.
 */
exports.markAsReviewed = async ({ reportId }) => {
  const report = await Report.findByIdAndUpdate(
    reportId,
    { $set: { status: "REJECTED" } },
    { new: true, runValidators: false }
  );
  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  const illegalCase = await IllegalCase.findOne({ baseReport: reportId });
  if (illegalCase) {
    illegalCase.isReviewed = true;
    await illegalCase.save();
    return { report, illegalCase };
  }
  return { report, illegalCase: null };
};

// Delete reviewed case card from dashboard (keeps Report document)
exports.deleteReviewedCase = async ({ reportId }) => {
  const report = await Report.findById(reportId);
  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }
  const illegalCase = await IllegalCase.findOneAndDelete({ baseReport: reportId });
  return { reportId, illegalCaseId: illegalCase ? illegalCase._id : null };
};

// ─── ILLEGAL CASE REVIEW RECORDS ─────────────────────────────────────────────

/**
 * FIX: Use findByIdAndUpdate instead of report.save() to avoid CastError.
 */
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
    vesselId: payload.vesselId,
    vesselType: payload.vesselType,
    severity: payload.severity,
    status: "OPEN",
    assignedOfficer: null,
    createdBy: actorId,
  });

  // FIX: Use findByIdAndUpdate to avoid CastError on attachments
  await Report.findByIdAndUpdate(
    reportId,
    { $set: { status: "VERIFIED" } },
    { runValidators: false }
  );

  return newCase;
};

exports.updateCase = async ({ caseId, payload }) => {
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
  const allowedUpdates = ["title", "description", "vesselId", "vesselType", "severity"];
  allowedUpdates.forEach((field) => {
    if (payload[field] !== undefined) illegalCase[field] = payload[field];
  });
  await illegalCase.save();
  return illegalCase;
};

exports.listCases = async ({ query }) => {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "50", 10), 1), 100);
  const skip = (page - 1) * limit;
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.severity) filter.severity = query.severity;
  if (query.assignedOfficer) filter.assignedOfficer = query.assignedOfficer;
  const sort = query.sort || "-createdAt";
  const [items, total] = await Promise.all([
    IllegalCase.find(filter)
      .populate("baseReport", "title reportType reportedBy location")
      .populate("createdBy", "name email")
      .populate("assignedOfficer", "name email")
      .sort(sort).skip(skip).limit(limit),
    IllegalCase.countDocuments(filter),
  ]);
  return { page, limit, total, items };
};

/**
 * FIX: Use .lean() so trackedVesselData (Mixed type) is returned as a plain
 * JavaScript object instead of a Mongoose Document. Without .lean(), accessing
 * vessel.imo etc. works in JS but JSON.stringify returns {} because Mongoose
 * wraps Mixed fields — causing empty values in the frontend textMap.
 */
exports.getCaseById = async (caseId) => {
  const doc = await IllegalCase.findById(caseId)
    .populate("baseReport")
    .populate("createdBy", "name email role")
    .populate("assignedOfficer", "name email role")
    .populate("escalatedBy", "name email")
    .lean(); // ensures trackedVesselData is a plain JS object, not Mongoose wrapper

  if (!doc) {
    const err = new Error("Illegal case not found");
    err.statusCode = 404;
    throw err;
  }
  return doc;
};

exports.deleteCase = async ({ caseId }) => {
  const illegalCase = await IllegalCase.findById(caseId);
  if (!illegalCase) {
    const err = new Error("Illegal case not found");
    err.statusCode = 404;
    throw err;
  }
  if (illegalCase.status === "ESCALATED") {
    const err = new Error("Cannot delete a record while it is escalated.");
    err.statusCode = 403;
    throw err;
  }
  await IllegalCase.findByIdAndDelete(caseId);
  return { id: caseId };
};

// ─── OFFICERS ─────────────────────────────────────────────────────────────────

exports.getOfficers = async () => {
  return User.find({ role: "OFFICER", isActive: true }).select("name email role");
};

// ─── ESCALATE ─────────────────────────────────────────────────────────────────

exports.escalateCase = async ({ caseId, officerId, actorId }) => {
  const illegalCase = await IllegalCase.findById(caseId);
  if (!illegalCase) {
    const err = new Error("Illegal case not found");
    err.statusCode = 404;
    throw err;
  }
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
  if (!illegalCase.trackButtonUsed) {
    const err = new Error("Please track the vessel data before escalating the case");
    err.statusCode = 400;
    throw err;
  }
  if (!officerId) {
    const err = new Error("Please assign an officer to escalate the case further");
    err.statusCode = 400;
    throw err;
  }
  const officer = await User.findById(officerId);
  if (!officer || officer.role !== "OFFICER") {
    const err = new Error("Selected user is not a valid officer");
    err.statusCode = 400;
    throw err;
  }

  illegalCase.assignedOfficer = officerId;
  illegalCase.status = "ESCALATED";
  illegalCase.escalatedAt = new Date();
  illegalCase.escalatedBy = actorId;
  await illegalCase.save();

  // FIX: Use findByIdAndUpdate to avoid CastError on attachments
  if (illegalCase.baseReport) {
    await Report.findByIdAndUpdate(
      illegalCase.baseReport,
      { $set: { status: "UNDER_REVIEW" } },
      { runValidators: false }
    );
  }

  return IllegalCase.findById(caseId)
    .populate("assignedOfficer", "name email role")
    .populate("escalatedBy", "name email")
    .lean();
};

// ─── RESOLVE ─────────────────────────────────────────────────────────────────

exports.resolveCase = async ({ caseId }) => {
  const illegalCase = await IllegalCase.findById(caseId);
  if (!illegalCase) {
    const err = new Error("Illegal case not found");
    err.statusCode = 404;
    throw err;
  }
  illegalCase.status = "RESOLVED";
  illegalCase.isReviewed = true;
  await illegalCase.save();

  // FIX: Use findByIdAndUpdate to avoid CastError on attachments
  if (illegalCase.baseReport) {
    await Report.findByIdAndUpdate(
      illegalCase.baseReport,
      { $set: { status: "RESOLVED" } },
      { runValidators: false }
    );
  }
  return illegalCase;
};

// ─── VESSEL TRACKING ──────────────────────────────────────────────────────────

exports.trackVessel = async ({ caseId }) => {
  const illegalCase = await IllegalCase.findById(caseId);
  if (!illegalCase) {
    const err = new Error("Illegal case not found");
    err.statusCode = 404;
    throw err;
  }
  if (illegalCase.trackButtonUsed) {
    const err = new Error("Vessel has already been tracked for this case. This action is permanent.");
    err.statusCode = 409;
    throw err;
  }

  const selectedUrl = VESSEL_API_URLS[illegalCase.severity];
  if (!selectedUrl) {
    const err = new Error("Invalid severity");
    err.statusCode = 400;
    throw err;
  }

  let vesselData, dataSource;
  try {
    const response = await axios.get(selectedUrl, { timeout: 10000 });
    vesselData = response.data;
    dataSource = "external_api";
    console.log(`[trackVessel] External API success severity=${illegalCase.severity}`);
  } catch (apiError) {
    console.warn(`[trackVessel] Fallback used: ${apiError.message}`);
    vesselData = FALLBACK_DATA[illegalCase.severity];
    dataSource = "fallback";
  }

  illegalCase.trackedVesselData = vesselData;
  illegalCase.trackButtonUsed = true;
  await illegalCase.save();

  return { vesselData, severity: illegalCase.severity, trackedAt: new Date(), dataSource };
};

// ─── NOTES ────────────────────────────────────────────────────────────────────

exports.addNote = async ({ caseId, content }) => {
  const illegalCase = await IllegalCase.findByIdAndUpdate(
    caseId,
    { $push: { reviewNotes: { content, addedAt: new Date() } } },
    { new: true, runValidators: true }
  );
  if (!illegalCase) {
    const err = new Error("Illegal case not found");
    err.statusCode = 404;
    throw err;
  }
  return illegalCase;
};