const Report = require("../models/Report");
const IllegalCase = require("../models/IllegalCase");

const enforcementService = require("../services/enforcementService");

const normalizeBooleanLikeFields = (payload, keys) => {
  const normalized = { ...payload };
  keys.forEach((key) => {
    if (normalized[key] === "true") normalized[key] = true;
    if (normalized[key] === "false") normalized[key] = false;
  });
  return normalized;
};

exports.create = async (req, res) => {
  try {
    const created = await enforcementService.create({
      relatedCase: req.body.relatedCase,
      priority: req.body.priority,
      notes: req.body.notes,
      penaltyAmount: req.body.penaltyAmount,
      courtDate: req.body.courtDate,
      courtReference: req.body.courtReference,
      leadOfficer: req.user._id,
      actorId: req.user._id,
    });
    res.status(201).json(created);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.createFromCase = async (req, res) => {
  try {
    const created = await enforcementService.createFromCase({
      caseId: req.params.caseId,
      officerId: req.user._id,
    });
    res.status(201).json(created);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.list = async (req, res) => {
  try {
    const result = await enforcementService.list({ query: req.query });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const doc = await enforcementService.getById(req.params.enforcementId);
    res.json(doc);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await enforcementService.update({
      enforcementId: req.params.enforcementId,
      payload: req.body,
      actorId: req.user._id,
    });
    res.json(updated);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await enforcementService.delete({ enforcementId: req.params.enforcementId });
    res.json({ message: "Deleted", id: deleted._id });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.addAction = async (req, res) => {
  try {
    const updated = await enforcementService.addAction({
      enforcementId: req.params.enforcementId,
      action: req.body,
      actorId: req.user._id,
    });
    res.json(updated);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.deleteAction = async (req, res) => {
  try {
    const updated = await enforcementService.deleteAction({
      enforcementId: req.params.enforcementId,
      actionId: req.params.actionId,
      actorId: req.user._id,
    });
    res.json(updated);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.updateAction = async (req, res) => {
  try {
    const updated = await enforcementService.updateAction({
      enforcementId: req.params.enforcementId,
      actionId: req.params.actionId,
      payload: req.body,
      actorId: req.user._id,
    });
    res.json(updated);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.generateRiskScore = async (req, res) => {
  try {
    const geminiService = require("../services/geminiService");

    const enforcement = await enforcementService.getById(req.params.enforcementId);

    const illegalCase = await IllegalCase.findById(enforcement.relatedCase._id);
    const report = await Report.findById(illegalCase.baseReport);

    // Call Gemini AI for enforcement risk analysis
    const aiResult = await geminiService.analyseEnforcementRisk({
      vesselName: illegalCase.vesselId || "Unknown",
      flagState: illegalCase.trackedVesselData?.flag || "Unknown",
      severity: illegalCase.severity,
      description: report?.description || illegalCase.description || "",
      locationName: report?.location?.address || "Unknown",
    });

    // Save latest + push to history
    const updated = await enforcementService.pushRiskAssessment({
      enforcementId: enforcement._id,
      assessment: {
        riskScore: aiResult.riskScore,
        riskLevel: aiResult.riskLevel,
        justification: aiResult.justification,
        recommendedActions: aiResult.recommendedActions,
        provider: "Gemini-2.0-flash",
        assessedAt: new Date(),
        assessedBy: req.user._id,
      },
      actorId: req.user._id,
    });

    res.json(updated);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.close = async (req, res) => {
  try {
    const doc = await enforcementService.closeEnforcement({
      enforcementId: req.params.enforcementId,
      outcome: req.body.outcome,
      penaltyAmount: req.body.penaltyAmount,
      notes: req.body.notes,
      actorId: req.user._id,
    });
    res.json(doc);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

/**
 * Get active officers for assignment dropdowns.
 * GET /api/enforcements/team/officers
 */
exports.getAssignableOfficers = async (req, res) => {
  try {
    const officers = await enforcementService.getAssignableOfficers();
    res.json(officers);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


/**
 * Get all evidence items for an enforcement record
 * GET /api/enforcements/:enforcementId/evidence
 */
exports.getEvidence = async (req, res) => {
  try {
    const evidence = await enforcementService.getEvidenceByEnforcement(req.params.enforcementId);
    res.json(evidence);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

/**
 * Add evidence item to an enforcement record
 * POST /api/enforcements/:enforcementId/evidence
 * Body (form-data): evidenceType, description, [files], storageLocation, etc.
 */
exports.addEvidence = async (req, res) => {
  try {
    const evidenceData = normalizeBooleanLikeFields(req.body, ["isSealed"]);

    // Map Cloudinary-uploaded files to structured attachment objects
    const attachments = (req.files || []).map((f) => ({
      url: f.path,           // Cloudinary secure URL
      publicId: f.filename,  // Cloudinary public_id (used for deletion)
      filename: f.originalname,
    }));

    const evidence = await enforcementService.addEvidence({
      enforcementId: req.params.enforcementId,
      evidenceData,
      attachments,
      actorId: req.user._id,
    });
    res.status(201).json(evidence);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

/**
 * Update existing evidence item
 * PATCH /api/enforcements/:enforcementId/evidence/:evidenceId
 * Body (form-data): evidenceType?, description?, [files], condition?, isSealed?, verified?
 */
exports.updateEvidence = async (req, res) => {
  try {
    const payload = normalizeBooleanLikeFields(req.body, ["isSealed", "verified"]);

    // Map any newly uploaded files
    const newAttachments = (req.files || []).map((f) => ({
      url: f.path,
      publicId: f.filename,
      filename: f.originalname,
    }));

    const evidence = await enforcementService.updateEvidence({
      enforcementId: req.params.enforcementId,
      evidenceId: req.params.evidenceId,
      payload,
      newAttachments,
      actorId: req.user._id,
    });
    res.json(evidence);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

/**
 * Delete evidence item from enforcement record
 * DELETE /api/enforcements/:enforcementId/evidence/:evidenceId
 */
exports.deleteEvidence = async (req, res) => {
  try {
    const deleted = await enforcementService.deleteEvidence({
      enforcementId: req.params.enforcementId,
      evidenceId: req.params.evidenceId,
      actorId: req.user._id,
    });
    res.json({ message: "Evidence deleted", id: deleted._id });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


/**
 * Get all team members for an enforcement record
 * GET /api/enforcements/:enforcementId/team
 */
exports.getTeam = async (req, res) => {
  try {
    const team = await enforcementService.getTeamByEnforcement(req.params.enforcementId);
    res.json(team);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

/**
 * Add team member to an enforcement record
 * POST /api/enforcements/:enforcementId/team
 * Body: { officerId, role, department, specialization, badgeNumber, contactNumber, responsibilities, notes }
 */
exports.addTeamMember = async (req, res) => {
  try {
    const member = await enforcementService.addTeamMember({
      enforcementId: req.params.enforcementId,
      teamData: req.body,
      actorId: req.user._id,
    });
    res.status(201).json(member);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

/**
 * Update team member details
 * PATCH /api/enforcements/:enforcementId/team/:memberId
 * Body: { role?, status?, department?, specialization?, hoursLogged?, responsibilities?, notes? }
 */
exports.updateTeamMember = async (req, res) => {
  try {
    const member = await enforcementService.updateTeamMember({
      enforcementId: req.params.enforcementId,
      memberId: req.params.memberId,
      payload: req.body,
      actorId: req.user._id,
    });
    res.json(member);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

/**
 * Remove team member from enforcement
 * DELETE /api/enforcements/:enforcementId/team/:memberId
 */
exports.deleteTeamMember = async (req, res) => {
  try {
    const deleted = await enforcementService.deleteTeamMember({
      enforcementId: req.params.enforcementId,
      memberId: req.params.memberId,
      actorId: req.user._id,
    });
    res.json({ message: "Team member removed", id: deleted._id });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


/**
 * Get basic enforcement statistics
 * GET /api/enforcements/stats/basic
 */
exports.getBasicStats = async (req, res) => {
  try {
    const stats = await enforcementService.getBasicStatistics();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

/**
 * Get statistics with date range filtering
 * GET /api/enforcements/stats/by-date?startDate=&endDate=&groupBy=day|week|month
 */
exports.getStatsByDateRange = async (req, res) => {
  try {
    const stats = await enforcementService.getStatisticsByDateRange({
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      groupBy: req.query.groupBy || "day",
    });
    res.json(stats);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
