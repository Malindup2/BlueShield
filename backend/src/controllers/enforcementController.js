const Report = require("../models/Report");
const IllegalCase = require("../models/IllegalCase");

const enforcementService = require("../services/enforcementService");

exports.create = async (req, res) => {
  try {
    const created = await enforcementService.create({
      relatedCase: req.body.relatedCase,
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

// ============================================================================
// EVIDENCE MANAGEMENT CONTROLLERS
// ============================================================================
// Handlers for evidence chain-of-custody operations.
// Evidence is critical for legal proceedings and court cases.
// ============================================================================

/**
 * Add evidence item to an enforcement record
 * POST /api/enforcements/:enforcementId/evidence
 * Body: { evidenceType, description, storageLocation, collectionMethod, condition, isSealed, sealNumber, notes }
 */
exports.addEvidence = async (req, res) => {
  try {
    const updated = await enforcementService.addEvidence({
      enforcementId: req.params.enforcementId,
      evidenceData: req.body,
      actorId: req.user._id,
    });
    res.json(updated);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

/**
 * Update existing evidence item
 * PATCH /api/enforcements/:enforcementId/evidence/:evidenceId
 * Body: { evidenceType?, description?, storageLocation?, condition?, isSealed?, sealNumber?, notes?, verified? }
 */
exports.updateEvidence = async (req, res) => {
  try {
    const updated = await enforcementService.updateEvidence({
      enforcementId: req.params.enforcementId,
      evidenceId: req.params.evidenceId,
      payload: req.body,
      actorId: req.user._id,
    });
    res.json(updated);
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
    const updated = await enforcementService.deleteEvidence({
      enforcementId: req.params.enforcementId,
      evidenceId: req.params.evidenceId,
      actorId: req.user._id,
    });
    res.json(updated);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};
