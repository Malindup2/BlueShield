const illegalCaseService = require("../services/illegalCaseService");

exports.getPendingReports = async (req, res) => {
  try { res.json(await illegalCaseService.getPendingReports()); }
  catch (e) { res.status(e.statusCode || 500).json({ message: e.message }); }
};

exports.markAsReviewed = async (req, res) => {
  try { res.json(await illegalCaseService.markAsReviewed({ reportId: req.params.reportId, actorId: req.user._id })); }
  catch (e) { res.status(e.statusCode || 500).json({ message: e.message }); }
};

exports.deleteReviewedCase = async (req, res) => {
  try { res.json({ message: "Case removed from dashboard", ...(await illegalCaseService.deleteReviewedCase({ reportId: req.params.reportId })) }); }
  catch (e) { res.status(e.statusCode || 500).json({ message: e.message }); }
};

exports.createCase = async (req, res) => {
  try { res.status(201).json(await illegalCaseService.createCase({ reportId: req.params.reportId, payload: req.body, actorId: req.user._id })); }
  catch (e) { res.status(e.statusCode || 500).json({ message: e.message }); }
};

exports.updateCase = async (req, res) => {
  try { res.json(await illegalCaseService.updateCase({ caseId: req.params.caseId, payload: req.body, actorId: req.user._id })); }
  catch (e) { res.status(e.statusCode || 500).json({ message: e.message }); }
};

exports.listCases = async (req, res) => {
  try { res.json(await illegalCaseService.listCases({ query: req.query })); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getCaseById = async (req, res) => {
  try { res.json(await illegalCaseService.getCaseById(req.params.caseId)); }
  catch (e) { res.status(e.statusCode || 500).json({ message: e.message }); }
};

exports.deleteCase = async (req, res) => {
  try { res.json({ message: "Record deleted", id: (await illegalCaseService.deleteCase({ caseId: req.params.caseId })).id }); }
  catch (e) { res.status(e.statusCode || 500).json({ message: e.message }); }
};

exports.getOfficers = async (req, res) => {
  try { res.json(await illegalCaseService.getOfficers()); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

exports.escalateCase = async (req, res) => {
  try { res.json(await illegalCaseService.escalateCase({ caseId: req.params.caseId, officerId: req.body.officerId, actorId: req.user._id })); }
  catch (e) { res.status(e.statusCode || 500).json({ message: e.message }); }
};


 // POST /api/illegal-cases/:caseId/resolve
 //Called when enforcement reaches CLOSED_RESOLVED.
 // Sets IllegalCase  RESOLVED and Report RESOLVED.
 
exports.resolveCase = async (req, res) => {
  try { res.json(await illegalCaseService.resolveCase({ caseId: req.params.caseId })); }
  catch (e) { res.status(e.statusCode || 500).json({ message: e.message }); }
};

exports.trackVessel = async (req, res) => {
  try { res.json(await illegalCaseService.trackVessel({ caseId: req.params.caseId })); }
  catch (e) { res.status(e.statusCode || 500).json({ message: e.message }); }
};

exports.addNote = async (req, res) => {
  try { res.json(await illegalCaseService.addNote({ caseId: req.params.caseId, content: req.body.content })); }
  catch (e) { res.status(e.statusCode || 500).json({ message: e.message }); }
};