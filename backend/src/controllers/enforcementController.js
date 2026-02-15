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

exports.generateRiskScore = async (req, res) => {
  try {
    const enforcement = await enforcementService.getById(req.params.enforcementId);

    const illegalCase = await IllegalCase.findById(enforcement.relatedCase._id);
    const report = await Report.findById(illegalCase.baseReport);

    // Stub for now (replace with Gemini later)
    let score = 5;
    if (illegalCase.severity === "HIGH") score = 8;
    if (illegalCase.severity === "CRITICAL") score = 10;

    const justification =
      `Risk based on severity=${illegalCase.severity}, reportLen=${(report.description || "").length}`;

    const updated = await enforcementService.update({
      enforcementId: enforcement._id,
      payload: {
        aiRiskScore: score,
        aiJustification: justification,
        aiProvider: "StubAI",
        aiFetchedAt: new Date(),
      },
      actorId: req.user._id,
    });

    res.json(updated);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};
