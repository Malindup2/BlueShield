const isObjectId = (v) => typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);

const REPORT_TYPES = ["ILLEGAL_FISHING", "HAZARD", "ENVIRONMENTAL", "OTHER"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES = ["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED", "RESOLVED"];

exports.create = (req) => {
  const errors = [];
  const body = req.body || {};

  if (!body.title) errors.push("title is required");
  if (body.title && body.title.length > 200) errors.push("title can be at most 200 characters");
  if (!body.description) errors.push("description is required");
  if (body.reportType && !REPORT_TYPES.includes(body.reportType)) errors.push("Invalid reportType");
  if (body.severity && !SEVERITIES.includes(body.severity)) errors.push("Invalid severity");
  if (body.location) {
    if (typeof body.location !== "object" || !body.location.type || !body.location.coordinates) errors.push("location must have type and coordinates");
    else if (body.location.type !== "Point") errors.push("location type must be Point");
    else if (!Array.isArray(body.location.coordinates) || body.location.coordinates.length !== 2) errors.push("coordinates must be [longitude, latitude]");
  }
  if (body.isAnonymous != null && typeof body.isAnonymous !== "boolean") errors.push("isAnonymous must be boolean");

  return { error: errors.length ? errors : null };
};

exports.list = (req) => {
  const errors = [];
  const q = req.query || {};

  const page = parseInt(q.page || "1", 10);
  const limit = parseInt(q.limit || "10", 10);
  if (Number.isNaN(page) || page < 1) errors.push("page must be >= 1");
  if (Number.isNaN(limit) || limit < 1 || limit > 50) errors.push("limit must be 1..50");

  if (q.reportType && !REPORT_TYPES.includes(q.reportType)) errors.push("Invalid reportType");
  if (q.severity && !SEVERITIES.includes(q.severity)) errors.push("Invalid severity");
  if (q.status && !STATUSES.includes(q.status)) errors.push("Invalid status");

  return { error: errors.length ? errors : null };
};

exports.getById = (req) => {
  const errors = [];
  if (!isObjectId(req.params.reportId)) errors.push("reportId must be a valid ObjectId");
  return { error: errors.length ? errors : null };
};

exports.update = (req) => {
  const errors = [];
  if (!isObjectId(req.params.reportId)) errors.push("reportId must be a valid ObjectId");

  const body = req.body || {};
  if (body.title && body.title.length > 200) errors.push("title can be at most 200 characters");
  if (body.reportType && !REPORT_TYPES.includes(body.reportType)) errors.push("Invalid reportType");
  if (body.severity && !SEVERITIES.includes(body.severity)) errors.push("Invalid severity");
  if (body.status && !STATUSES.includes(body.status)) errors.push("Invalid status");
  if (body.location) {
    if (typeof body.location !== "object" || !body.location.type || !body.location.coordinates) errors.push("location must have type and coordinates");
    else if (body.location.type !== "Point") errors.push("location type must be Point");
    else if (!Array.isArray(body.location.coordinates) || body.location.coordinates.length !== 2) errors.push("coordinates must be [longitude, latitude]");
  }
  if (body.isAnonymous != null && typeof body.isAnonymous !== "boolean") errors.push("isAnonymous must be boolean");

  return { error: errors.length ? errors : null };
};

exports.remove = (req) => {
  const errors = [];
  if (!isObjectId(req.params.reportId)) errors.push("reportId must be a valid ObjectId");
  return { error: errors.length ? errors : null };
};