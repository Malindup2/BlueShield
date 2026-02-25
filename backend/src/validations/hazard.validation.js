const isObjectId = (v) => typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);

const HANDLING_STATUS = ["OPEN", "MONITORING", "MITIGATION_PLANNED", "MITIGATION_IN_PROGRESS", "RESOLVED"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const HAZARD_CATEGORIES = ["WEATHER", "POLLUTION", "DEBRIS", "OBSTRUCTION", "OTHER"];


exports.fromReport = (req) => {
  const errors = [];
  if (!isObjectId(req.params.reportId)) errors.push("reportId must be a valid ObjectId");

  const body = req.body || {};
  if (body.hazardCategory && !HAZARD_CATEGORIES.includes(body.hazardCategory)) errors.push("Invalid hazardCategory");
  if (body.severity && !SEVERITIES.includes(body.severity)) errors.push("Invalid severity");
  if (body.zoneRequired != null && typeof body.zoneRequired !== "boolean") errors.push("zoneRequired must be boolean");

  return { error: errors.length ? errors : null };
};


exports.list = (req) => {
  const errors = [];
  const q = req.query || {};

  const page = parseInt(q.page || "1", 10);
  const limit = parseInt(q.limit || "10", 10);
  if (Number.isNaN(page) || page < 1) errors.push("page must be >= 1");
  if (Number.isNaN(limit) || limit < 1 || limit > 50) errors.push("limit must be 1..50");

  if (q.handlingStatus && !HANDLING_STATUS.includes(q.handlingStatus)) errors.push("Invalid handlingStatus");
  if (q.hazardCategory && !HAZARD_CATEGORIES.includes(q.hazardCategory)) errors.push("Invalid hazardCategory");
  if (q.severity && !SEVERITIES.includes(q.severity)) errors.push("Invalid severity");
  if (q.zoneRequired && !["true", "false"].includes(String(q.zoneRequired))) errors.push("zoneRequired must be true/false");
  if (q.caseId != null && typeof q.caseId !== "string") errors.push("caseId must be a string");

  return { error: errors.length ? errors : null };
};



exports.getById = (req) => {
  const errors = [];
  if (!isObjectId(req.params.id)) errors.push("id must be a valid ObjectId");
  return { error: errors.length ? errors : null };
};



exports.update = (req) => {
  const errors = [];
  if (!isObjectId(req.params.id)) errors.push("id must be a valid ObjectId");

  const body = req.body || {};

  // allow statuses but block RESOLVED here
  if (body.handlingStatus) {
    if (!HANDLING_STATUS.includes(body.handlingStatus)) errors.push("Invalid handlingStatus");
    if (body.handlingStatus === "RESOLVED") errors.push("Use /hazards/:id/resolve to resolve a hazard");
  }

  if (body.hazardCategory && !HAZARD_CATEGORIES.includes(body.hazardCategory)) errors.push("Invalid hazardCategory");
  if (body.severity && !SEVERITIES.includes(body.severity)) errors.push("Invalid severity");
  if (body.zoneRequired != null && typeof body.zoneRequired !== "boolean") errors.push("zoneRequired must be boolean");

  return { error: errors.length ? errors : null };
};




exports.resolve = (req) => {
  const errors = [];
  if (!isObjectId(req.params.id)) errors.push("id must be a valid ObjectId");

  const body = req.body || {};
  if (body.resolutionNote != null && typeof body.resolutionNote !== "string") errors.push("resolutionNote must be string");

  return { error: errors.length ? errors : null };
};

exports.weather = exports.getById;