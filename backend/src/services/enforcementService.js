const Enforcement = require("../models/Enforcement");
const IllegalCase = require("../models/IllegalCase");
const Report = require("../models/Report");
const Evidence = require("../models/Evidence");
const TeamMember = require("../models/TeamMember");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

const assertOfficerOwnership = (enforcement, actor, actorId) => {
  if (!actor || actor.role !== "OFFICER") return;
  const ownerId = enforcement.leadOfficer?._id?.toString?.() || enforcement.leadOfficer?.toString?.();
  if (!ownerId || ownerId !== actorId?.toString()) {
    const err = new Error("Access Denied: You cannot access a case assigned to another officer");
    err.statusCode = 403;
    throw err;
  }
};


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

exports.list = async ({ query, user }) => {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) filter.status = query.status;
  
  // Role-based filtering: Officers only see their assigned cases
  if (user && user.role === "OFFICER") {
    filter.leadOfficer = user._id;
  }

  const sort = query.sort || "-createdAt";

  const [items, total] = await Promise.all([
    Enforcement.find(filter)
      .populate({
        path: "relatedCase",
        populate: [
          { path: "baseReport" },
          { path: "escalatedBy", select: "name email role" },
        ],
      })
      .populate("leadOfficer", "name email role")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Enforcement.countDocuments(filter),
  ]);

  return { page, limit, total, items };
};

exports.getById = async (enforcementId, user) => {
  const doc = await Enforcement.findById(enforcementId)
    .populate({
      path: "relatedCase",
      populate: [
        { path: "baseReport" },
        { path: "escalatedBy", select: "name email role" },
      ],
    })
    .populate("leadOfficer", "name email role");

  if (!doc) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  // Security Check (IDOR)
  if (user && user.role === "OFFICER" && doc.leadOfficer?._id.toString() !== user._id.toString()) {
    const err = new Error("Access Denied: You are not assigned to this case");
    err.statusCode = 403;
    throw err;
  }

  return doc;
};

exports.update = async ({ enforcementId, payload, actor, actorId }) => {
  const doc = await Enforcement.findById(enforcementId);
  if (!doc) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  // Security Check (IDOR)
  if (actor && actor.role === "OFFICER" && doc.leadOfficer?.toString() !== actorId) {
    const err = new Error("Access Denied: You cannot modify a case assigned to another officer");
    err.statusCode = 403;
    throw err;
  }

  const updated = await Enforcement.findByIdAndUpdate(
    enforcementId,
    { ...payload, updatedBy: actorId },
    { new: true, runValidators: true }
  );

  return updated;
};

exports.delete = async ({ enforcementId, actor, actorId }) => {
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  assertOfficerOwnership(enforcement, actor, actorId);

  const deleted = await Enforcement.findByIdAndDelete(enforcementId);
  if (!deleted) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return deleted;
};

exports.addAction = async ({ enforcementId, action, actor, actorId }) => {
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  assertOfficerOwnership(enforcement, actor, actorId);

  enforcement.actions.push(action);
  enforcement.updatedBy = actorId;
  await enforcement.save();

  return enforcement;
};

exports.deleteAction = async ({ enforcementId, actionId, actor, actorId }) => {
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  assertOfficerOwnership(enforcement, actor, actorId);

  enforcement.actions.pull({ _id: actionId });
  enforcement.updatedBy = actorId;
  await enforcement.save();
  return enforcement;
};

exports.updateAction = async ({ enforcementId, actionId, payload, actor, actorId }) => {
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  assertOfficerOwnership(enforcement, actor, actorId);

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

exports.closeEnforcement = async ({ enforcementId, outcome, penaltyAmount, notes, actor, actorId }) => {
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  // Security Check (IDOR)
  assertOfficerOwnership(enforcement, actor, actorId);

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

  // Global sync: when enforcement is resolved, mirror status to illegal case + original report.
  const resolvedCase = await IllegalCase.findByIdAndUpdate(
    enforcement.relatedCase,
    { $set: { status: "RESOLVED", isReviewed: true } },
    { new: true, runValidators: false }
  );

  if (resolvedCase?.baseReport) {
    await Report.findByIdAndUpdate(
      resolvedCase.baseReport,
      { $set: { status: "RESOLVED" } },
      { runValidators: false }
    );
  }

  return updated;
};




/**
 * Add new evidence item for an enforcement record
 * Creates a new Evidence document with auto-generated reference number
 * @param {Object} params - Contains enforcementId, evidenceData, actorId
 * @returns {Object} Newly created evidence document
 */
exports.addEvidence = async ({ enforcementId, evidenceData, attachments, actor, actorId }) => {
  // Verify enforcement exists
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  assertOfficerOwnership(enforcement, actor, actorId);

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
exports.getEvidenceByEnforcement = async (enforcementId, actor) => {
  const enforcement = await Enforcement.findById(enforcementId)
    .populate({
      path: "relatedCase",
      populate: {
        path: "baseReport",
        select: "title description attachments reportedBy createdAt",
        populate: { path: "reportedBy", select: "name email" },
      },
    });
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  assertOfficerOwnership(enforcement, actor, actor?._id);

  const enforcementEvidence = await Evidence.find({ enforcement: enforcementId })
    .populate("collectedBy", "name email")
    .populate("verifiedBy", "name email")
    .sort("-collectedAt");

  const report = enforcement.relatedCase?.baseReport;
  const reportAttachments = Array.isArray(report?.attachments) ? report.attachments : [];

  const reportEvidenceItems = reportAttachments
    .filter((attachment) => Boolean(attachment?.url))
    .map((attachment, index) => {
      const attachmentType = String(attachment.type || "").toLowerCase();
      const mappedType = attachmentType.includes("video")
        ? "VIDEO"
        : attachmentType.includes("image") || attachmentType.includes("photo")
        ? "PHOTOGRAPH"
        : "DOCUMENT";

      const reportId = report?._id?.toString?.() || "REPORT";
      const shortReportId = reportId.slice(-6).toUpperCase();

      return {
        _id: `report-${reportId}-${index + 1}`,
        source: "REPORT_ATTACHMENT",
        enforcement: enforcementId,
        referenceNumber: `RPT-${shortReportId}-${String(index + 1).padStart(2, "0")}`,
        evidenceType: mappedType,
        description: report?.title
          ? `Fisherman Report: ${report.title}`
          : report?.description || "Fisherman report attachment",
        storageLocation: "Fisherman Submitted Report",
        collectionMethod: "Citizen submission",
        condition: "INTACT",
        isSealed: false,
        collectedBy: report?.reportedBy || null,
        collectedAt: attachment.uploadedAt || report?.createdAt || enforcement.createdAt,
        verifiedBy: null,
        verifiedAt: null,
        attachments: [
          {
            url: attachment.url,
            filename: `Report Attachment ${index + 1}`,
            uploadedAt: attachment.uploadedAt || report?.createdAt || enforcement.createdAt,
          },
        ],
        notes: "Linked from fisherman report",
      };
    });

  return [...enforcementEvidence.map((item) => item.toObject()), ...reportEvidenceItems].sort(
    (a, b) => new Date(b.collectedAt || 0).getTime() - new Date(a.collectedAt || 0).getTime()
  );
};

/**
 * Update existing evidence item details
 * Preserves chain of custody by keeping original collection data
 * @param {Object} params - Contains enforcementId, evidenceId, payload, actorId
 * @returns {Object} Updated evidence document
 */
exports.updateEvidence = async ({ enforcementId, evidenceId, payload, newAttachments, actor, actorId }) => {
  // Verify enforcement exists
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  assertOfficerOwnership(enforcement, actor, actorId);

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
exports.deleteEvidence = async ({ enforcementId, evidenceId, actor, actorId }) => {
  // Verify enforcement exists
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  assertOfficerOwnership(enforcement, actor, actorId);

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
exports.addTeamMember = async ({ enforcementId, teamData, actor, actorId }) => {
  // Verify enforcement exists
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  assertOfficerOwnership(enforcement, actor, actorId);

  const normalizedStatus = teamData.status === "ACTIVE" ? "ON_DUTY" : teamData.status;

  const selectedId = teamData.officerId;

  const officerUser = selectedId
    ? await User.findOne({
        _id: selectedId,
        role: "OFFICER",
        isActive: true,
      }).select("name email role")
    : null;

  if (selectedId && !officerUser) {
    const err = new Error("Selected officer user is invalid or inactive");
    err.statusCode = 400;
    throw err;
  }

  const memberName = officerUser?.name || teamData.name;
  const memberEmail = officerUser?.email || teamData.email;

  if (!officerUser && (!memberName || !memberEmail)) {
    const err = new Error("name and email are required when no officer user is selected");
    err.statusCode = 400;
    throw err;
  }

  // A member is "on duty" when they are ACTIVE in any non-resolved case.
  // Prevent assigning the same identity to another case while on duty.
  const identityFilter = officerUser
    ? { officer: officerUser._id }
    : { email: memberEmail.toLowerCase() };

  const activeAssignments = await TeamMember.find({
    ...identityFilter,
    status: "ON_DUTY",
    enforcement: { $ne: enforcementId },
  }).populate("enforcement", "status");

  const onDutyElsewhere = activeAssignments.find(
    (assignment) => assignment.enforcement?.status && assignment.enforcement.status !== "CLOSED_RESOLVED"
  );

  if (onDutyElsewhere) {
    const err = new Error("Member is currently on duty in another active case");
    err.statusCode = 409;
    throw err;
  }

  // Check if member is already in the team (unique index will also catch this)
  const existingMember = await TeamMember.findOne({
    enforcement: enforcementId,
    ...(officerUser ? { officer: officerUser._id } : { email: memberEmail.toLowerCase() }),
  });
  if (existingMember) {
    const err = new Error("Member is already assigned to this enforcement team");
    err.statusCode = 409;
    throw err;
  }

  // Create new team member with enforcement reference
  const newMember = await TeamMember.create({
    enforcement: enforcementId,
    officer: officerUser ? officerUser._id : null,
    name: memberName,
    email: memberEmail,
    badgeNumber: teamData.badgeNumber,
    department: teamData.department,
    contactNumber: teamData.contactNumber,
    responsibilities: teamData.responsibilities,
    role: teamData.role,
    status: normalizedStatus || "ON_DUTY",
    specialization: teamData.specialization,
    hoursLogged: teamData.hoursLogged || 0,
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
exports.getTeamByEnforcement = async (enforcementId, actor) => {
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  assertOfficerOwnership(enforcement, actor, actor?._id);

  const members = await TeamMember.find({ enforcement: enforcementId })
    .populate("officer", "name email role")
    .populate("assignedBy", "name email")
    .populate("relievedBy", "name email")
    .sort("-assignedAt");

  return members.map((memberDoc) => {
    const member = memberDoc.toObject();
    if (!member.officer && member.name && member.email) {
      member.officer = {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        source: "DIRECT",
      };
    }
    return member;
  });
};

/**
 * Update team member details
 * @param {Object} params - Contains enforcementId, memberId, payload, actorId
 * @returns {Object} Updated team member document
 */
exports.updateTeamMember = async ({ enforcementId, memberId, payload, actor, actorId }) => {
  // Verify enforcement exists
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  assertOfficerOwnership(enforcement, actor, actorId);

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
  if (payload.status) updateData.status = payload.status === "ACTIVE" ? "ON_DUTY" : payload.status;
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
exports.deleteTeamMember = async ({ enforcementId, memberId, actor, actorId }) => {
  // Verify enforcement exists
  const enforcement = await Enforcement.findById(enforcementId);
  if (!enforcement) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }

  assertOfficerOwnership(enforcement, actor, actorId);

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

/**
 * Return active officers available for team assignment in enforcement workflows.
 * @returns {Array}
 */
exports.getAssignableOfficers = async () => {
  return User.find({
    role: "OFFICER",
    isActive: true,
  })
    .select("name email role")
    .sort({ name: 1 });
};
