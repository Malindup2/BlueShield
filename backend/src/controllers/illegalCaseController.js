const illegalCaseService = require("../services/illegalCaseService");

// Returns all pending illegal fishing  reports 
 
exports.getPendingReports = async (req, res) => {
  try {
    const reports = await illegalCaseService.getPendingReports();
    res.json(reports);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

// change the report status as reviewed
 
exports.markAsReviewed = async (req, res) => {
  try {
    const result = await illegalCaseService.markAsReviewed({
      reportId: req.params.reportId,
      actorId: req.user._id,
    });
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


 // Deletes the associated IllegalCase record but keeps the base Report.
 
exports.deleteReviewedCase = async (req, res) => {
  try {
    const result = await illegalCaseService.deleteReviewedCase({
      reportId: req.params.reportId,
    });
    res.json({ message: "Case removed from dashboard", ...result });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

// illegal case review record controllers

// create a new case record

exports.createCase = async (req, res) => {
  try {
    const newCase = await illegalCaseService.createCase({
      reportId: req.params.reportId,
      payload: req.body,
      actorId: req.user._id,
    });
    res.status(201).json(newCase);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


 // Updates an existing illegal case review record.
 
exports.updateCase = async (req, res) => {
  try {
    const updated = await illegalCaseService.updateCase({
      caseId: req.params.caseId,
      payload: req.body,
      actorId: req.user._id,
    });
    res.json(updated);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


 // get all illegal case review records 
 
exports.listCases = async (req, res) => {
  try {
    const result = await illegalCaseService.listCases({ query: req.query });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


 //  Returns full details of a specific record 
 
exports.getCaseById = async (req, res) => {
  try {
    const doc = await illegalCaseService.getCaseById(req.params.caseId);
    res.json(doc);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


 // Deletes an illegal case review record.
 
exports.deleteCase = async (req, res) => {
  try {
    const result = await illegalCaseService.deleteCase({ caseId: req.params.caseId });
    res.json({ message: "Record deleted", id: result.id });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


 
 // Returns all users with role OFFICER for assigning a specific officer for the record
 
exports.getOfficers = async (req, res) => {
  try {
    const officers = await illegalCaseService.getOfficers();
    res.json(officers);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// escalating the case to the relavant officer and mark the status as 'escalated'

exports.escalateCase = async (req, res) => {
  try {
    const updated = await illegalCaseService.escalateCase({
      caseId: req.params.caseId,
      officerId: req.body.officerId,
      actorId: req.user._id,
    });
    res.json(updated);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


 //  POST /api/illegal-cases/:caseId/track
 //  Calls external API based on severity

exports.trackVessel = async (req, res) => {
  try {
    const result = await illegalCaseService.trackVessel({ caseId: req.params.caseId });
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};



 //  POST /api/illegal-cases/:caseId/notes
 // Adds a reference note
 
exports.addNote = async (req, res) => {
  try {
    const updated = await illegalCaseService.addNote({
      caseId: req.params.caseId,
      content: req.body.content,
    });
    res.json(updated);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};