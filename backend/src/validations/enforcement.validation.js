const isObjectId = (v) => typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);
const isBooleanLike = (v) => typeof v === "boolean" || v === "true" || v === "false";

const ACTION_TYPES = ["INSPECTION", "FINE_ISSUED", "WARNING", "ARREST", "SEIZURE"];
const ENF_STATUS = ["OPEN", "COURT_PENDING", "CLOSED_RESOLVED"];

exports.create = (req) => {
  const errors = [];
  const body = req.body || {};

  if (!body.relatedCase || !isObjectId(body.relatedCase)) errors.push("relatedCase is required (ObjectId)");

  const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  if (body.priority && !PRIORITIES.includes(body.priority)) errors.push("Invalid priority");
  if (body.penaltyAmount != null && (typeof body.penaltyAmount !== "number" || body.penaltyAmount < 0)) errors.push("penaltyAmount must be >= 0");
  if (body.courtDate && isNaN(Date.parse(body.courtDate))) errors.push("courtDate must be a valid date");

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

exports.updateAction = (req) => {
  const errors = [];
  if (!isObjectId(req.params.enforcementId)) errors.push("enforcementId must be a valid ObjectId");
  if (!isObjectId(req.params.actionId)) errors.push("actionId must be a valid ObjectId");

  const body = req.body || {};
  if (body.actionType && !ACTION_TYPES.includes(body.actionType)) errors.push("Invalid actionType");
  if (body.amount != null && (typeof body.amount !== "number" || body.amount < 0)) errors.push("amount must be a number >= 0");

  return { error: errors.length ? errors : null };
};

exports.close = (req) => {
  const errors = [];
  if (!isObjectId(req.params.enforcementId)) errors.push("enforcementId must be a valid ObjectId");

  const body = req.body || {};
  const OUTCOMES = ["PENDING", "WARNING_ISSUED", "FINE_COLLECTED", "EQUIPMENT_SEIZED", "VESSEL_SEIZED", "ARREST_MADE", "CASE_DISMISSED"];
  if (body.outcome && !OUTCOMES.includes(body.outcome)) errors.push("Invalid outcome");
  if (body.penaltyAmount != null && (typeof body.penaltyAmount !== "number" || body.penaltyAmount < 0)) errors.push("penaltyAmount must be >= 0");

  return { error: errors.length ? errors : null };
};

// EVIDENCE VALIDATIONS

const EVIDENCE_TYPES = ["PHOTOGRAPH", "VIDEO", "DOCUMENT", "PHYSICAL_ITEM", "TESTIMONY", "DIGITAL_LOG"];
const EVIDENCE_CONDITIONS = ["INTACT", "DAMAGED", "DETERIORATED", "SEALED"];


exports.addEvidence = (req) => {
  const errors = [];
  if (!isObjectId(req.params.enforcementId)) errors.push("enforcementId must be a valid ObjectId");

  const body = req.body || {};

  // Required fields
  if (!body.evidenceType || !EVIDENCE_TYPES.includes(body.evidenceType)) {
    errors.push(`evidenceType is required and must be one of: ${EVIDENCE_TYPES.join(", ")}`);
  }
  if (!body.description || typeof body.description !== "string" || body.description.trim().length === 0) {
    errors.push("description is required");
  }
  if (body.description && body.description.length > 500) {
    errors.push("description must be 500 characters or less");
  }

  // Optional field validations
  if (body.storageLocation && body.storageLocation.length > 200) {
    errors.push("storageLocation must be 200 characters or less");
  }
  if (body.collectionMethod && body.collectionMethod.length > 300) {
    errors.push("collectionMethod must be 300 characters or less");
  }
  if (body.condition && !EVIDENCE_CONDITIONS.includes(body.condition)) {
    errors.push(`condition must be one of: ${EVIDENCE_CONDITIONS.join(", ")}`);
  }
  if (body.isSealed !== undefined && !isBooleanLike(body.isSealed)) {
    errors.push("isSealed must be a boolean");
  }
  if (body.notes && body.notes.length > 500) {
    errors.push("notes must be 500 characters or less");
  }

  return { error: errors.length ? errors : null };
};


exports.updateEvidence = (req) => {
  const errors = [];
  if (!isObjectId(req.params.enforcementId)) errors.push("enforcementId must be a valid ObjectId");
  if (!isObjectId(req.params.evidenceId)) errors.push("evidenceId must be a valid ObjectId");

  const body = req.body || {};

  // Optional field validations (same as add, but all optional)
  if (body.evidenceType && !EVIDENCE_TYPES.includes(body.evidenceType)) {
    errors.push(`evidenceType must be one of: ${EVIDENCE_TYPES.join(", ")}`);
  }
  if (body.description && body.description.length > 500) {
    errors.push("description must be 500 characters or less");
  }
  if (body.condition && !EVIDENCE_CONDITIONS.includes(body.condition)) {
    errors.push(`condition must be one of: ${EVIDENCE_CONDITIONS.join(", ")}`);
  }
  if (body.isSealed !== undefined && !isBooleanLike(body.isSealed)) {
    errors.push("isSealed must be a boolean");
  }
  if (body.verified !== undefined && !isBooleanLike(body.verified)) {
    errors.push("verified must be a boolean");
  }

  return { error: errors.length ? errors : null };
};


exports.deleteEvidence = (req) => {
  const errors = [];
  if (!isObjectId(req.params.enforcementId)) errors.push("enforcementId must be a valid ObjectId");
  if (!isObjectId(req.params.evidenceId)) errors.push("evidenceId must be a valid ObjectId");
  return { error: errors.length ? errors : null };
};

const TEAM_ROLES = ["LEAD_INVESTIGATOR", "INVESTIGATOR", "EVIDENCE_HANDLER", "SURVEILLANCE", "LEGAL_LIAISON", "SUPPORT"];
const TEAM_STATUS = ["ACTIVE", "ON_LEAVE", "RELIEVED"];

exports.addTeamMember = (req) => {
  const errors = [];
  if (!isObjectId(req.params.enforcementId)) errors.push("enforcementId must be a valid ObjectId");

  const body = req.body || {};

  // Required fields
  const hasOfficerId = body.officerId && isObjectId(body.officerId);
  const hasDirectMemberDetails =
    typeof body.name === "string" && body.name.trim().length >= 2 &&
    typeof body.email === "string" && /^\S+@\S+\.\S+$/.test(body.email);

  if (!hasOfficerId && !hasDirectMemberDetails) {
    errors.push("Provide either a valid officerId or direct member name/email details");
  }
  if (!body.role || !TEAM_ROLES.includes(body.role)) {
    errors.push(`role is required and must be one of: ${TEAM_ROLES.join(", ")}`);
  }

  // Optional field validations
  if (body.name && body.name.length > 100) {
    errors.push("name must be 100 characters or less");
  }
  if (body.email && !/^\S+@\S+\.\S+$/.test(body.email)) {
    errors.push("email must be valid");
  }
  if (body.badgeNumber && body.badgeNumber.length > 50) {
    errors.push("badgeNumber must be 50 characters or less");
  }
  if (body.status && !TEAM_STATUS.includes(body.status)) {
    errors.push(`status must be one of: ${TEAM_STATUS.join(", ")}`);
  }
  if (body.department && body.department.length > 100) {
    errors.push("department must be 100 characters or less");
  }
  if (body.specialization && body.specialization.length > 100) {
    errors.push("specialization must be 100 characters or less");
  }
  if (body.contactNumber && body.contactNumber.length > 20) {
    errors.push("contactNumber must be 20 characters or less");
  }
  if (body.hoursLogged !== undefined && (typeof body.hoursLogged !== "number" || body.hoursLogged < 0)) {
    errors.push("hoursLogged must be a number >= 0");
  }
  if (body.responsibilities && !Array.isArray(body.responsibilities)) {
    errors.push("responsibilities must be an array of strings");
  }
  if (body.notes && body.notes.length > 500) {
    errors.push("notes must be 500 characters or less");
  }

  return { error: errors.length ? errors : null };
};

exports.updateTeamMember = (req) => {
  const errors = [];
  if (!isObjectId(req.params.enforcementId)) errors.push("enforcementId must be a valid ObjectId");
  if (!isObjectId(req.params.memberId)) errors.push("memberId must be a valid ObjectId");

  const body = req.body || {};

  // Optional field validations
  if (body.role && !TEAM_ROLES.includes(body.role)) {
    errors.push(`role must be one of: ${TEAM_ROLES.join(", ")}`);
  }
  if (body.status && !TEAM_STATUS.includes(body.status)) {
    errors.push(`status must be one of: ${TEAM_STATUS.join(", ")}`);
  }
  if (body.hoursLogged !== undefined && (typeof body.hoursLogged !== "number" || body.hoursLogged < 0)) {
    errors.push("hoursLogged must be a number >= 0");
  }
  if (body.responsibilities && !Array.isArray(body.responsibilities)) {
    errors.push("responsibilities must be an array of strings");
  }
  if (body.notes && body.notes.length > 500) {
    errors.push("notes must be 500 characters or less");
  }

  return { error: errors.length ? errors : null };
};

exports.deleteTeamMember = (req) => {
  const errors = [];
  if (!isObjectId(req.params.enforcementId)) errors.push("enforcementId must be a valid ObjectId");
  if (!isObjectId(req.params.memberId)) errors.push("memberId must be a valid ObjectId");
  return { error: errors.length ? errors : null };
};
