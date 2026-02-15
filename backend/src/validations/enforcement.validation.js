const isObjectId = (v) => typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);

const ACTION_TYPES = ["INSPECTION", "FINE_ISSUED", "WARNING", "ARREST", "SEIZURE"];
const ENF_STATUS = ["OPEN", "COURT_PENDING", "CLOSED_RESOLVED"];

exports.create = (req) => {
  const errors = [];
  const body = req.body || {};

  if (!body.relatedCase || !isObjectId(body.relatedCase)) errors.push("relatedCase is required (ObjectId)");

  return { error: errors.length ? errors : null };
};

exports.fromCase = (req) => {
  const errors = [];
  if (!isObjectId(req.params.caseId)) errors.push("caseId must be a valid ObjectId");
  return { error: errors.length ? errors : null };
};

exports.getById = (req) => {
  const errors = [];
  if (!isObjectId(req.params.enforcementId)) errors.push("enforcementId must be a valid ObjectId");
  return { error: errors.length ? errors : null };
};

exports.update = (req) => {
  const errors = [];
  if (!isObjectId(req.params.enforcementId)) errors.push("enforcementId must be a valid ObjectId");

  const body = req.body || {};
  if (body.status && !ENF_STATUS.includes(body.status)) errors.push("Invalid status");

  return { error: errors.length ? errors : null };
};

exports.addAction = (req) => {
  const errors = [];
  if (!isObjectId(req.params.enforcementId)) errors.push("enforcementId must be a valid ObjectId");

  const body = req.body || {};
  if (!body.actionType || !ACTION_TYPES.includes(body.actionType)) errors.push("Invalid actionType");
  if (body.amount != null && (typeof body.amount !== "number" || body.amount < 0)) errors.push("amount must be a number >= 0");

  return { error: errors.length ? errors : null };
};

exports.deleteAction = (req) => {
  const errors = [];
  if (!isObjectId(req.params.enforcementId)) errors.push("enforcementId must be a valid ObjectId");
  if (!isObjectId(req.params.actionId)) errors.push("actionId must be a valid ObjectId");
  return { error: errors.length ? errors : null };
};
