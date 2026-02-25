const Enforcement = require("../models/Enforcement");
const IllegalCase = require("../models/IllegalCase");

// ============================================================================
// ENFORCEMENT SERVICE - Business Logic Layer
// ============================================================================
// Handles all enforcement-related operations including:
// - CRUD operations for enforcement records
// - Action logging (inspections, fines, arrests, seizures)
// - Evidence management with chain of custody
// - Team assignment and management
// - AI risk assessment integration
// - Case closure with outcomes
// ============================================================================

// Helper to generate unique reference numbers
const generateRefNumber = (prefix) => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
  return `${prefix}-${year}-${random}`;
};

exports.create = async ({ relatedCase, leadOfficer, actorId }) => {
  // one enforcement per case (your schema has unique)
  const existing = await Enforcement.findOne({ relatedCase });
  if (existing) {
    const err = new Error("Enforcement already exists for this case");
    err.statusCode = 409;
    throw err;
  }

  // ensure case exists
  const theCase = await IllegalCase.findById(relatedCase);
  if (!theCase) {
    const err = new Error("IllegalCase not found");
    err.statusCode = 404;
    throw err;
  }

  return Enforcement.create({
    relatedCase,
    leadOfficer,
    updatedBy: actorId,
  });
};

exports.createFromCase = async ({ caseId, officerId }) => {
  return exports.create({ relatedCase: caseId, leadOfficer: officerId, actorId: officerId });
};

exports.list = async ({ query }) => {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) filter.status = query.status;

  const sort = query.sort || "-createdAt";

  const [items, total] = await Promise.all([
    Enforcement.find(filter).sort(sort).skip(skip).limit(limit),
    Enforcement.countDocuments(filter),
  ]);

  return { page, limit, total, items };
};

exports.getById = async (enforcementId) => {
  const doc = await Enforcement.findById(enforcementId)
    .populate({
      path: "relatedCase",
      populate: { path: "baseReport" },
    })
    .populate("leadOfficer", "name email role");

  if (!doc) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return doc;
};

exports.update = async ({ enforcementId, payload, actorId }) => {
  const updated = await Enforcement.findByIdAndUpdate(
    enforcementId,
    { ...payload, updatedBy: actorId },
    { new: true, runValidators: true }
  );

  if (!updated) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

exports.delete = async ({ enforcementId }) => {
  const deleted = await Enforcement.findByIdAndDelete(enforcementId);
  if (!deleted) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return deleted;
};

exports.addAction = async ({ enforcementId, action, actorId }) => {
  const updated = await Enforcement.findByIdAndUpdate(
    enforcementId,
    { $push: { actions: action }, updatedBy: actorId },
    { new: true, runValidators: true }
  );

  if (!updated) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

exports.deleteAction = async ({ enforcementId, actionId, actorId }) => {
  const updated = await Enforcement.findByIdAndUpdate(
    enforcementId,
    { $pull: { actions: { _id: actionId } }, updatedBy: actorId },
    { new: true }
  );

  if (!updated) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

exports.updateAction = async ({ enforcementId, actionId, payload, actorId }) => {
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  const action = enforcement.actions.id(actionId);
  if (!action) {
    const err = new Error("Action not found");
    err.statusCode = 404;
    throw err;
  }

  // Update only the fields provided
  if (payload.actionType) action.actionType = payload.actionType;
  if (payload.description !== undefined) action.description = payload.description;
  if (payload.amount !== undefined) action.amount = payload.amount;

  enforcement.updatedBy = actorId;
  await enforcement.save();
  return enforcement;
};

exports.pushRiskAssessment = async ({ enforcementId, assessment, actorId }) => {
  const updated = await Enforcement.findByIdAndUpdate(
    enforcementId,
    {
      $set: {
        aiRiskScore: assessment.riskScore,
        aiJustification: assessment.justification,
        aiProvider: assessment.provider || "Gemini-2.0-flash",
        aiFetchedAt: new Date(),
        updatedBy: actorId,
      },
      $push: { riskScoreHistory: assessment },
    },
    { new: true, runValidators: true }
  );

  if (!updated) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

exports.closeEnforcement = async ({ enforcementId, outcome, penaltyAmount, notes, actorId }) => {
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  if (enforcement.status === "CLOSED_RESOLVED") {
    const err = new Error("Enforcement is already closed");
    err.statusCode = 409;
    throw err;
  }

  const updated = await Enforcement.findByIdAndUpdate(
    enforcementId,
    {
      $set: {
        status: "CLOSED_RESOLVED",
        outcome: outcome || enforcement.outcome,
        penaltyAmount: penaltyAmount ?? enforcement.penaltyAmount,
        notes: notes || enforcement.notes,
        closedAt: new Date(),
        closedBy: actorId,
        updatedBy: actorId,
      },
    },
    { new: true, runValidators: true }
  );

  return updated;
};

// ============================================================================
// EVIDENCE MANAGEMENT - Chain of Custody Operations
// ============================================================================
// These methods handle evidence collection, updates, and removal.
// Each evidence item gets a unique reference number for court proceedings.
// ============================================================================

/**
 * Add new evidence item to an enforcement record
 * Creates unique reference number for chain of custody tracking
 * @param {Object} params - Contains enforcementId, evidence data, actorId
 * @returns {Object} Updated enforcement document with new evidence
 */
exports.addEvidence = async ({ enforcementId, evidenceData, actorId }) => {
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  // Generate unique reference number for evidence tracking
  const refNumber = generateRefNumber("EV");

  const newEvidence = {
    ...evidenceData,
    referenceNumber: refNumber,
    collectedBy: actorId,
    collectedAt: new Date(),
  };

  const updated = await Enforcement.findByIdAndUpdate(
    enforcementId,
    {
      $push: { evidence: newEvidence },
      $set: { updatedBy: actorId },
    },
    { new: true, runValidators: true }
  );

  return updated;
};

/**
 * Update existing evidence item details
 * Preserves chain of custody by keeping original collection data
 * @param {Object} params - Contains enforcementId, evidenceId, payload, actorId
 * @returns {Object} Updated enforcement document
 */
exports.updateEvidence = async ({ enforcementId, evidenceId, payload, actorId }) => {
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  const evidence = enforcement.evidence.id(evidenceId);
  if (!evidence) {
    const err = new Error("Evidence not found");
    err.statusCode = 404;
    throw err;
  }

  // Update allowed fields (preserving chain of custody data)
  if (payload.evidenceType) evidence.evidenceType = payload.evidenceType;
  if (payload.description !== undefined) evidence.description = payload.description;
  if (payload.storageLocation !== undefined) evidence.storageLocation = payload.storageLocation;
  if (payload.collectionMethod !== undefined) evidence.collectionMethod = payload.collectionMethod;
  if (payload.condition) evidence.condition = payload.condition;
  if (payload.isSealed !== undefined) evidence.isSealed = payload.isSealed;
  if (payload.sealNumber !== undefined) evidence.sealNumber = payload.sealNumber;
  if (payload.notes !== undefined) evidence.notes = payload.notes;

  // Allow marking as verified
  if (payload.verified) {
    evidence.verifiedBy = actorId;
    evidence.verifiedAt = new Date();
  }

  enforcement.updatedBy = actorId;
  await enforcement.save();
  return enforcement;
};

/**
 * Delete evidence item from enforcement record
 * Note: In real systems, evidence deletion should be restricted/audited
 * @param {Object} params - Contains enforcementId, evidenceId, actorId
 * @returns {Object} Updated enforcement document
 */
exports.deleteEvidence = async ({ enforcementId, evidenceId, actorId }) => {
  const updated = await Enforcement.findByIdAndUpdate(
    enforcementId,
    {
      $pull: { evidence: { _id: evidenceId } },
      $set: { updatedBy: actorId },
    },
    { new: true }
  );

  if (!updated) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
};
