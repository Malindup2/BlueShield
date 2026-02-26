const Enforcement = require("../models/Enforcement");
const IllegalCase = require("../models/IllegalCase");
const Evidence = require("../models/Evidence");
const TeamMember = require("../models/TeamMember");
const cloudinary = require("../config/cloudinary");


//

exports.create = async ({ relatedCase, leadOfficer, priority, notes, penaltyAmount, courtDate, courtReference, actorId }) => {
  // one enforcement per case 
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
    ...(priority && { priority }),
    ...(notes && { notes }),
    ...(penaltyAmount != null && { penaltyAmount }),
    ...(courtDate && { courtDate }),
    ...(courtReference && { courtReference }),
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




/**
 * Add new evidence item for an enforcement record
 * Creates a new Evidence document with auto-generated reference number
 * @param {Object} params - Contains enforcementId, evidenceData, actorId
 * @returns {Object} Newly created evidence document
 */
exports.addEvidence = async ({ enforcementId, evidenceData, attachments, actorId }) => {
  // Verify enforcement exists
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  // Create new evidence with enforcement reference
  const newEvidence = await Evidence.create({
    enforcement: enforcementId,
    ...evidenceData,
    attachments: attachments || [],
    collectedBy: actorId,
    collectedAt: new Date(),
  });

  // Update enforcement timestamp
  await Enforcement.findByIdAndUpdate(enforcementId, { updatedBy: actorId });

  return newEvidence;
};

/**
 * Get all evidence items for an enforcement record
 * @param {String} enforcementId - The enforcement ID
 * @returns {Array} Array of evidence documents
 */
exports.getEvidenceByEnforcement = async (enforcementId) => {
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  return Evidence.find({ enforcement: enforcementId })
    .populate("collectedBy", "name email")
    .populate("verifiedBy", "name email")
    .sort("-collectedAt");
};

/**
 * Update existing evidence item details
 * Preserves chain of custody by keeping original collection data
 * @param {Object} params - Contains enforcementId, evidenceId, payload, actorId
 * @returns {Object} Updated evidence document
 */
exports.updateEvidence = async ({ enforcementId, evidenceId, payload, newAttachments, actorId }) => {
  // Verify enforcement exists
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  // Find and verify evidence belongs to this enforcement
  const evidence = await Evidence.findOne({ _id: evidenceId, enforcement: enforcementId });
  if (!evidence) {
    const err = new Error("Evidence not found for this enforcement");
    err.statusCode = 404;
    throw err;
  }

  // Build update object (preserving chain of custody data)
  const updateData = {};
  if (payload.evidenceType) updateData.evidenceType = payload.evidenceType;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.storageLocation !== undefined) updateData.storageLocation = payload.storageLocation;
  if (payload.collectionMethod !== undefined) updateData.collectionMethod = payload.collectionMethod;
  if (payload.condition) updateData.condition = payload.condition;
  if (payload.isSealed !== undefined) updateData.isSealed = payload.isSealed;
  if (payload.sealNumber !== undefined) updateData.sealNumber = payload.sealNumber;
  if (payload.notes !== undefined) updateData.notes = payload.notes;

  // Allow marking as verified
  if (payload.verified) {
    updateData.verifiedBy = actorId;
    updateData.verifiedAt = new Date();
  }

  // Push any newly uploaded Cloudinary files into the attachments array
  const updateOps = { $set: updateData };
  if (newAttachments && newAttachments.length > 0) {
    updateOps.$push = { attachments: { $each: newAttachments } };
  }

  const updated = await Evidence.findByIdAndUpdate(
    evidenceId,
    updateOps,
    { new: true, runValidators: true }
  );

  // Update enforcement timestamp
  await Enforcement.findByIdAndUpdate(enforcementId, { updatedBy: actorId });

  return updated;
};

/**
 * Delete evidence item from enforcement record
 * Note: In real systems, evidence deletion should be restricted/audited
 * @param {Object} params - Contains enforcementId, evidenceId, actorId
 * @returns {Object} Deleted evidence document
 */
exports.deleteEvidence = async ({ enforcementId, evidenceId, actorId }) => {
  // Verify enforcement exists
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  // Find and verify evidence belongs to this enforcement
  const evidence = await Evidence.findOne({ _id: evidenceId, enforcement: enforcementId });
  if (!evidence) {
    const err = new Error("Evidence not found for this enforcement");
    err.statusCode = 404;
    throw err;
  }

  // Delete all Cloudinary files attached to this evidence (cleanup)
  if (evidence.attachments && evidence.attachments.length > 0) {
    await Promise.allSettled(
      evidence.attachments
        .filter((a) => a.publicId)
        .map((a) => cloudinary.uploader.destroy(a.publicId, { resource_type: "auto" }))
    );
  }

  await Evidence.findByIdAndDelete(evidenceId);

  // Update enforcement timestamp
  await Enforcement.findByIdAndUpdate(enforcementId, { updatedBy: actorId });

  return evidence;
};


/**
 * Add a new team member to an enforcement record
 * Creates a new TeamMember document with enforcement reference
 * @param {Object} params - Contains enforcementId, teamData, actorId
 * @returns {Object} Newly created team member document
 */
exports.addTeamMember = async ({ enforcementId, teamData, actorId }) => {
  // Verify enforcement exists
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  // Check if officer is already in the team (unique index will also catch this)
  const existingMember = await TeamMember.findOne({
    enforcement: enforcementId,
    officer: teamData.officerId,
  });
  if (existingMember) {
    const err = new Error("Officer is already assigned to this enforcement team");
    err.statusCode = 409;
    throw err;
  }

  // Create new team member with enforcement reference
  const newMember = await TeamMember.create({
    enforcement: enforcementId,
    officer: teamData.officerId,
    role: teamData.role,
    status: teamData.status || "ACTIVE",
    department: teamData.department,
    specialization: teamData.specialization,
    badgeNumber: teamData.badgeNumber,
    contactNumber: teamData.contactNumber,
    hoursLogged: teamData.hoursLogged || 0,
    responsibilities: teamData.responsibilities,
    notes: teamData.notes,
    assignedAt: new Date(),
    assignedBy: actorId,
  });

  // Update enforcement timestamp
  await Enforcement.findByIdAndUpdate(enforcementId, { updatedBy: actorId });

  return newMember;
};

/**
 * Get all team members for an enforcement record
 * @param {String} enforcementId - The enforcement ID
 * @returns {Array} Array of team member documents
 */
exports.getTeamByEnforcement = async (enforcementId) => {
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  return TeamMember.find({ enforcement: enforcementId })
    .populate("officer", "name email role")
    .populate("assignedBy", "name email")
    .populate("relievedBy", "name email")
    .sort("-assignedAt");
};

/**
 * Update team member details
 * @param {Object} params - Contains enforcementId, memberId, payload, actorId
 * @returns {Object} Updated team member document
 */
exports.updateTeamMember = async ({ enforcementId, memberId, payload, actorId }) => {
  // Verify enforcement exists
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  // Find and verify team member belongs to this enforcement
  const member = await TeamMember.findOne({ _id: memberId, enforcement: enforcementId });
  if (!member) {
    const err = new Error("Team member not found for this enforcement");
    err.statusCode = 404;
    throw err;
  }

  // Build update object
  const updateData = {};
  if (payload.role) updateData.role = payload.role;
  if (payload.status) updateData.status = payload.status;
  if (payload.department !== undefined) updateData.department = payload.department;
  if (payload.specialization !== undefined) updateData.specialization = payload.specialization;
  if (payload.badgeNumber !== undefined) updateData.badgeNumber = payload.badgeNumber;
  if (payload.contactNumber !== undefined) updateData.contactNumber = payload.contactNumber;
  if (payload.hoursLogged !== undefined) updateData.hoursLogged = payload.hoursLogged;
  if (payload.responsibilities !== undefined) updateData.responsibilities = payload.responsibilities;
  if (payload.notes !== undefined) updateData.notes = payload.notes;

  // Handle relieving member
  if (payload.status === "RELIEVED") {
    updateData.relievedAt = new Date();
    updateData.relievedBy = actorId;
  }

  const updated = await TeamMember.findByIdAndUpdate(
    memberId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  // Update enforcement timestamp
  await Enforcement.findByIdAndUpdate(enforcementId, { updatedBy: actorId });

  return updated;
};

/**
 * Remove team member from enforcement
 * @param {Object} params - Contains enforcementId, memberId, actorId
 * @returns {Object} Deleted team member document
 */
exports.deleteTeamMember = async ({ enforcementId, memberId, actorId }) => {
  // Verify enforcement exists
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  // Find and verify team member belongs to this enforcement
  const member = await TeamMember.findOne({ _id: memberId, enforcement: enforcementId });
  if (!member) {
    const err = new Error("Team member not found for this enforcement");
    err.statusCode = 404;
    throw err;
  }

  await TeamMember.findByIdAndDelete(memberId);

  // Update enforcement timestamp
  await Enforcement.findByIdAndUpdate(enforcementId, { updatedBy: actorId });

  return member;
};


// DASHBOARD STATISTICS - Enforcement Analytics
/**
 * Get basic enforcement statistics
 * Counts by status, priority, and outcome
 * @returns {Object} Statistics object with counts
 */
exports.getBasicStatistics = async () => {
  // Count by status
  const statusCounts = await Enforcement.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  // Count by priority
  const priorityCounts = await Enforcement.aggregate([
    { $group: { _id: "$priority", count: { $sum: 1 } } },
  ]);

  // Count by outcome
  const outcomeCounts = await Enforcement.aggregate([
    { $group: { _id: "$outcome", count: { $sum: 1 } } },
  ]);

  // Total count
  const totalCount = await Enforcement.countDocuments();

  // Format results into objects for easier access
  const byStatus = {};
  statusCounts.forEach((s) => {
    byStatus[s._id] = s.count;
  });

  const byPriority = {};
  priorityCounts.forEach((p) => {
    byPriority[p._id] = p.count;
  });

  const byOutcome = {};
  outcomeCounts.forEach((o) => {
    byOutcome[o._id] = o.count;
  });

  return {
    total: totalCount,
    byStatus,
    byPriority,
    byOutcome,
  };
};

/**
 * Get enforcement statistics with date range filtering
 * Supports daily, weekly, monthly aggregations
 * @param {Object} params - Contains startDate, endDate, groupBy
 * @returns {Object} Statistics with time-based breakdown
 */
exports.getStatisticsByDateRange = async ({ startDate, endDate, groupBy = "day" }) => {
  // Default to last 30 days if no dates provided
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Date grouping format based on groupBy parameter
  let dateFormat;
  switch (groupBy) {
    case "week":
      dateFormat = { $isoWeek: "$createdAt" };
      break;
    case "month":
      dateFormat = { $month: "$createdAt" };
      break;
    case "year":
      dateFormat = { $year: "$createdAt" };
      break;
    default:
      dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
  }

  // Aggregate enforcements created within date range
  const createdByPeriod = await Enforcement.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: dateFormat,
        count: { $sum: 1 },
        highPriority: {
          $sum: { $cond: [{ $in: ["$priority", ["HIGH", "CRITICAL"]] }, 1, 0] },
        },
        closed: {
          $sum: { $cond: [{ $eq: ["$status", "CLOSED_RESOLVED"] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Aggregate enforcements closed within date range
  const closedByPeriod = await Enforcement.aggregate([
    {
      $match: {
        closedAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: groupBy === "day"
          ? { $dateToString: { format: "%Y-%m-%d", date: "$closedAt" } }
          : groupBy === "week"
            ? { $isoWeek: "$closedAt" }
            : { $month: "$closedAt" },
        count: { $sum: 1 },
        totalPenalty: { $sum: "$penaltyAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Calculate totals for the period
  const periodTotals = await Enforcement.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        totalCreated: { $sum: 1 },
        totalPenalty: { $sum: "$penaltyAmount" },
        avgRiskScore: { $avg: "$aiRiskScore" },
      },
    },
  ]);

  return {
    dateRange: { start, end, groupBy },
    createdByPeriod,
    closedByPeriod,
    periodSummary: periodTotals[0] || { totalCreated: 0, totalPenalty: 0, avgRiskScore: null },
  };
};
