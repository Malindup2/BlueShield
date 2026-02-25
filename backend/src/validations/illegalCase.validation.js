
const isObjectId = (v) => typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);

// statuses
const CASE_STATUSES = ["OPEN", "ESCALATED", "RESOLVED"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// Vessel ID must be "IMO-" followed by exactly 7 digits
const isValidVesselId = (v) => typeof v === "string" && /^IMO-\d{7}$/.test(v);

// Vessel type must be letters only 
const isValidVesselType = (v) =>
  typeof v === "string" && /^[a-zA-Z\s]+$/.test(v.trim()) && v.trim().length > 0;


exports.reportId = (req) => {
  const errors = [];
  if (!isObjectId(req.params.reportId)) errors.push("reportId must be a valid ObjectId");
  return { error: errors.length ? errors : null };
};



 //  Validates body when CREATING a new illegal case review record.
 
exports.createCase = (req) => {
  const errors = [];
  const body = req.body || {};

  if (!isObjectId(req.params.reportId)) errors.push("reportId must be a valid ObjectId");

  if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
    errors.push("title is required");
  }
  if (body.title && body.title.length > 200) {
    errors.push("title must be 200 characters or fewer");
  }

  if (!body.description || typeof body.description !== "string" || body.description.trim().length === 0) {
    errors.push("description is required");
  }

  if (!body.vesselId) {
    errors.push("vesselId is required");
  } else if (!isValidVesselId(body.vesselId)) {
    errors.push("vesselId must be in the format IMO- followed by exactly 7 digits (e.g. IMO-1234567)");
  }

  if (!body.vesselType || !isValidVesselType(body.vesselType)) {
    errors.push("vesselType is required and must contain letters only (spaces between words are allowed)");
  }

  if (!body.severity || !SEVERITIES.includes(body.severity)) {
    errors.push(`severity is required and must be one of: ${SEVERITIES.join(", ")}`);
  }

  return { error: errors.length ? errors : null };
};


//  Validates body when UPDATING an existing illegal case review record.
 
exports.updateCase = (req) => {
  const errors = [];
  const body = req.body || {};

  if (!isObjectId(req.params.caseId)) errors.push("caseId must be a valid ObjectId");

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      errors.push("title must be a non-empty string");
    }
    if (body.title && body.title.length > 200) {
      errors.push("title must be 200 characters or fewer");
    }
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string" || body.description.trim().length === 0) {
      errors.push("description must be a non-empty string");
    }
  }

  if (body.vesselId !== undefined) {
    if (!isValidVesselId(body.vesselId)) {
      errors.push("vesselId must be in the format IMO- followed by exactly 7 digits (e.g. IMO-1234567)");
    }
  }

  if (body.vesselType !== undefined) {
    if (!isValidVesselType(body.vesselType)) {
      errors.push("vesselType must contain letters only (spaces between words are allowed)");
    }
  }

  if (body.severity !== undefined) {
    if (!SEVERITIES.includes(body.severity)) {
      errors.push(`severity must be one of: ${SEVERITIES.join(", ")}`);
    }
  }

  return { error: errors.length ? errors : null };
};


 //  Validates case id

exports.caseId = (req) => {
  const errors = [];
  if (!isObjectId(req.params.caseId)) errors.push("caseId must be a valid ObjectId");
  return { error: errors.length ? errors : null };
};


 // Validates the escalate request.
 // ( officerId must be provided and be a valid ObjectId.)

exports.escalateCase = (req) => {
  const errors = [];
  if (!isObjectId(req.params.caseId)) errors.push("caseId must be a valid ObjectId");

  const { officerId } = req.body || {};
  if (!officerId) {
    errors.push("Please assign an officer to escalate the case further");
  } else if (!isObjectId(officerId)) {
    errors.push("officerId must be a valid ObjectId");
  }

  return { error: errors.length ? errors : null };
};


 // Validates adding a note

exports.addNote = (req) => {
  const errors = [];
  if (!isObjectId(req.params.caseId)) errors.push("caseId must be a valid ObjectId");

  const { content } = req.body || {};
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    errors.push("note content is required and cannot be empty");
  }

  return { error: errors.length ? errors : null };
};