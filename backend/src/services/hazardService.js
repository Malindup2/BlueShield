const Hazard = require("../models/Hazard");
const Report = require("../models/Report");



const ALLOWED_REPORT_TYPES = ["HAZARD", "ENVIRONMENTAL"];


const buildFilter = (query = {}) => {
  const filter = {};
  if (query.handlingStatus) filter.handlingStatus = query.handlingStatus;
  if (query.hazardCategory) filter.hazardCategory = query.hazardCategory;
  if (query.severity) filter.severity = query.severity;
  if (query.zoneRequired != null) filter.zoneRequired = String(query.zoneRequired) === "true";
  if (query.caseId) filter.caseId = query.caseId;
  return filter;
};



const nextCaseId = async () => {
  const last = await Hazard.findOne({}, { caseId: 1 }).sort({ createdAt: -1 }).lean();
  const m = last?.caseId?.match(/^HZ(\d+)$/);
  const lastNum = m ? parseInt(m[1], 10) : 0;
  return `HZ${String(lastNum + 1).padStart(3, "0")}`;
};

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

    // allow zoneRequired from body, default false if missing
    zoneRequired: typeof payload.zoneRequired === "boolean" ? payload.zoneRequired : false,

    createdBy: actorId,
    updatedBy: actorId,
  });

  return created;
};



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
