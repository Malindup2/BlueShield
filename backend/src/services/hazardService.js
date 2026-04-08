const Hazard = require("../models/Hazard");
const Report = require("../models/Report");
const Zone = require("../models/Zone");
const marineService = require("./marineService");


/**
 * Only these report types are allowed to be converted into a Hazard case.
 */
const ALLOWED_REPORT_TYPES = ["HAZARD", "ENVIRONMENTAL"];



/**
 * Build Mongo filter from query params.
 * Keep this small so list() stays clean and consistent across endpoints.
 */
const buildFilter = (query = {}) => {
  const filter = {};
  if (query.handlingStatus) filter.handlingStatus = query.handlingStatus;
  if (query.hazardCategory) filter.hazardCategory = query.hazardCategory;
  if (query.severity) filter.severity = query.severity;
  if (query.zoneRequired != null) filter.zoneRequired = String(query.zoneRequired) === "true";
  if (query.caseId) filter.caseId = query.caseId;
  return filter;
};



/**
 * Generates the next sequential hazard case ID in HZ### format.
 */
const nextCaseId = async () => {
  const last = await Hazard.findOne({}, { caseId: 1 }).sort({ createdAt: -1 }).lean();
  const m = last?.caseId?.match(/^HZ(\d+)$/);
  const lastNum = m ? parseInt(m[1], 10) : 0;
  return `HZ${String(lastNum + 1).padStart(3, "0")}`;
};



/**
 * Create a Hazard case from an existing Report.
 * Rules enforced here:
 * - One hazard per report (baseReport unique)
 * - Report must exist, be VERIFIED, and be an allowed type
 */
exports.createFromReport = async ({ reportId, payload, actorId }) => {
  const existing = await Hazard.findOne({ baseReport: reportId });
  if (existing) {
    const err = new Error("Hazard case already exists for this report");
    err.statusCode = 409;
    throw err;
  }

  const report = await Report.findById(reportId);
  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  if (!ALLOWED_REPORT_TYPES.includes(report.reportType)) {
    const err = new Error("This report type cannot be converted to a Hazard");
    err.statusCode = 400;
    throw err;
  }

  if (report.status !== "VERIFIED") {
    const err = new Error("Report must be VERIFIED before creating a Hazard case");
    err.statusCode = 409;
    throw err;
  }

  const caseId = await nextCaseId();

  const created = await Hazard.create({
    caseId,
    baseReport: reportId,
    hazardCategory: payload.hazardCategory || "OTHER",
    severity: payload.severity || report.severity || "MEDIUM",
    handlingStatus: "OPEN",

  
    zoneRequired: typeof payload.zoneRequired === "boolean" ? payload.zoneRequired : false,

    createdBy: actorId,
    updatedBy: actorId,
  });

  return created;
};



/**
 * List hazards with pagination and filtering.
 * Populates baseReport so UI can show report details together with the hazard.
 */
exports.list = async ({ query }) => {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 50);
  const skip = (page - 1) * limit;

  const filter = buildFilter(query);
  const sort = query.sort || "-createdAt";

  const [items, total] = await Promise.all([
    // populate baseReport so admin can see the report details
    Hazard.find(filter).sort(sort).skip(skip).limit(limit).populate("baseReport"),
    Hazard.countDocuments(filter),
  ]);

  return { page, limit, total, items };
};



/**
 * Get hazard by id (with baseReport details).
 */
exports.getById = async (id) => {
  const doc = await Hazard.findById(id).populate("baseReport");
  if (!doc) {
    const err = new Error("Hazard not found");
    err.statusCode = 404;
    throw err;
  }
  return doc;
};



/**
 * Update hazard fields.
 * Important rule: RESOLVED status update is only allowed through resolve() function (keeps resolution workflow consistent).
 */
exports.update = async ({ id, payload, actorId }) => {
  const current = await Hazard.findById(id);
  if (!current) {
    const err = new Error("Hazard not found");
    err.statusCode = 404;
    throw err;
  }

  // Prevent bypassing the resolution workflow.
  if (payload?.handlingStatus === "RESOLVED") {
    const err = new Error("Use /hazards/:id/resolve to resolve a hazard");
    err.statusCode = 409;
    throw err;
  }

  const updated = await Hazard.findByIdAndUpdate(
    id,
    { $set: { ...payload, updatedBy: actorId } },
    { new: true, runValidators: true }
  );

  return updated;
};



/**
 * Fetch marine/weather conditions based on hazard coordinates and store snapshot in lastWeatherCheck.
 * Returns the stored snapshot with advisory warning.
 */
exports.fetchWeatherAndSave = async ({ id, actorId }) => {
  const hazard = await Hazard.findById(id).populate("baseReport");
  if (!hazard) {
    const err = new Error("Hazard not found");
    err.statusCode = 404;
    throw err;
  }

  const coords = hazard.baseReport?.location?.coordinates;
  if (!coords || coords.length !== 2) {
    const err = new Error("Hazard has no valid coordinates");
    err.statusCode = 400;
    throw err;
  }

  const [lng, lat] = coords;

  const marineResult = await marineService.fetchMarineConditions({ lat, lng });

  const updated = await Hazard.findByIdAndUpdate(
    id,
    { $set: { lastWeatherCheck: marineResult, updatedBy: actorId } },
    { new: true, runValidators: true }
  );

  return updated.lastWeatherCheck;
};




/**
 * Resolve hazard and apply side-effects:
 * - hazard => RESOLVED + resolvedAt + note
 * - active zone (if any) => DISABLED
 * - base report => RESOLVED
 */
exports.resolve = async ({ id, resolutionNote, actorId }) => {
  const hazard = await Hazard.findById(id);
  if (!hazard) {
    const err = new Error("Hazard not found");
    err.statusCode = 404;
    throw err;
  }

  const updatedHazard = await Hazard.findByIdAndUpdate(
    id,
    {
      $set: {
        handlingStatus: "RESOLVED",
        resolvedAt: new Date(),
        resolutionNote: resolutionNote || hazard.resolutionNote || null,
        updatedBy: actorId,
      },
    },
    { new: true, runValidators: true }
  );

  await Zone.updateOne(
    { sourceHazard: id, status: "ACTIVE" },
    { $set: { status: "DISABLED", updatedBy: actorId } }
  );

  await Report.findByIdAndUpdate(hazard.baseReport, { $set: { status: "RESOLVED" } });

  return updatedHazard;
};



/**
 * Only allow deleting a hazard after it is RESOLVED and no ACTIVE zones exist.
 * (Prevents deleting cases that are still operationally relevant.)
 */
exports.deleteIfAllowed = async ({ id }) => {
  const hazard = await Hazard.findById(id);
  if (!hazard) {
    const err = new Error("Hazard not found");
    err.statusCode = 404;
    throw err;
  }

  if (hazard.handlingStatus !== "RESOLVED") {
    const err = new Error("Hazard can only be deleted when handlingStatus is RESOLVED");
    err.statusCode = 409;
    throw err;
  }

  const activeZoneCount = await Zone.countDocuments({ sourceHazard: id, status: "ACTIVE" });
  if (activeZoneCount > 0) {
    const err = new Error("Hazard cannot be deleted while an ACTIVE zone exists");
    err.statusCode = 409;
    throw err;
  }

  await Hazard.deleteOne({ _id: id });
  return { deletedId: id };
};




exports.listReviewReports = async ({ query }) => {


  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 50);
  const skip = (page - 1) * limit;

  const filter = {
    reportType: { $in: ["HAZARD", "ENVIRONMENTAL"] },
  };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.reportType && ["HAZARD", "ENVIRONMENTAL"].includes(query.reportType)) {
    filter.reportType = query.reportType;
  }

  if (query.severity) {
    filter.severity = query.severity;
  }

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
      { "location.address": { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }

  const sort = query.sort || "-createdAt";

  const [items, total] = await Promise.all([
    Report.find(filter)
      .populate("reportedBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Report.countDocuments(filter),
  ]);

  return { page, limit, total, items };
};





exports.getReviewReportById = async (reportId) => {
 

  const doc = await Report.findById(reportId)
    .populate("reportedBy", "name email")
    .lean(); 

  if (!doc) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  if (!["HAZARD", "ENVIRONMENTAL"].includes(doc.reportType)) {
    const err = new Error("This report is not available in hazard review");
    err.statusCode = 400;
    throw err;
  }

  return doc; 
};





exports.updateReviewReportStatus = async ({ reportId, payload, actorId }) => {


  const allowedStatuses = ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"];

  const report = await Report.findById(reportId);
  if (!report) {
    const err = new Error("Report not found");
    err.statusCode = 404;
    throw err;
  }

  if (!["HAZARD", "ENVIRONMENTAL"].includes(report.reportType)) {
    const err = new Error("Only HAZARD or ENVIRONMENTAL reports can be reviewed here");
    err.statusCode = 400;
    throw err;
  }

  if (!payload.status || !allowedStatuses.includes(payload.status)) {
    const err = new Error("Invalid review status");
    err.statusCode = 400;
    throw err;
  }

  if (report.status === "RESOLVED") {
    const err = new Error("Resolved report cannot be changed here");
    err.statusCode = 409;
    throw err;
  }

  if (payload.status === "PENDING" || payload.status === "UNDER_REVIEW") {
    const existingHazard = await Hazard.findOne({ baseReport: reportId });
    if (existingHazard) {
      const err = new Error("Cannot move report back after hazard case creation");
      err.statusCode = 409;
      throw err;
    }
  }

  const updated = await Report.findByIdAndUpdate(
    reportId,
    { $set: { status: payload.status } },
    { new: true, runValidators: true }
  ).populate("reportedBy", "name email");

  return updated;
};




exports.getDashboardSummary = async () => {
  const [
    pendingReports,
    activeZones,
    disabledZones,
    verifiedHazardCases,
    recentPendingReports,
    hazardCases,
    activeZoneItems,
  ] = await Promise.all([
    Report.countDocuments({
      reportType: { $in: ["HAZARD", "ENVIRONMENTAL"] },
      status: "PENDING",
    }),

    Zone.countDocuments({ status: "ACTIVE" }),

    Zone.countDocuments({ status: "DISABLED" }),

    Hazard.countDocuments({
      handlingStatus: { $ne: "RESOLVED" },
    }),

    Report.find({
      reportType: { $in: ["HAZARD", "ENVIRONMENTAL"] },
      status: "PENDING",
    })
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),

    Hazard.find({})
      .select("hazardCategory")
      .lean(),

    Zone.find({ status: "ACTIVE" })
      .limit(20)
      .populate("sourceHazard", "caseId hazardCategory severity handlingStatus")
      .lean(),
  ]);

  const categoryBase = {
    WEATHER: 0,
    POLLUTION: 0,
    DEBRIS: 0,
    OBSTRUCTION: 0,
    OTHER: 0,
  };

  for (const hazard of hazardCases) {
    const key = hazard?.hazardCategory || "OTHER";
    if (categoryBase[key] !== undefined) {
      categoryBase[key] += 1;
    } else {
      categoryBase.OTHER += 1;
    }
  }

  const monthlyCategoryChart = Object.entries(categoryBase).map(([category, count]) => ({
    category,
    count,
  }));

  return {
    stats: {
      pendingReports,
      activeZones,
      disabledZones,
      verifiedHazardCases,
    },
    monthlyCategoryChart,
    recentPendingReports,
    activeZonesMap: activeZoneItems,
  };
};