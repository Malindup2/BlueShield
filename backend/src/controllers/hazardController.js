const hazardService = require("../services/hazardService");


/**
 * Create a hazard case from a verified report.
 */
exports.createFromReport = async (req, res) => {
  try {
    const doc = await hazardService.createFromReport({
      reportId: req.params.reportId,
      payload: req.body,
      actorId: req.user._id,
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


/**
 * List hazard cases (supports pagination and filters).
 */
exports.list = async (req, res) => {
  try {
    const result = await hazardService.list({ query: req.query });
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


/**
 * Get a single hazard by id.
 */
exports.getById = async (req, res) => {
  try {
    const doc = await hazardService.getById(req.params.id);
    res.json(doc);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};



/**
 * Update hazard fields (resolution handled separately).
 */
exports.update = async (req, res) => {
  try {
    const doc = await hazardService.update({
      id: req.params.id,
      payload: req.body,
      actorId: req.user._id,
    });
    res.json(doc);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


/**
 * Fetch and store latest marine/weather snapshot for a hazard.
 */
exports.weather = async (req, res) => {
  try {
    const result = await hazardService.fetchWeatherAndSave({
      id: req.params.id,
      actorId: req.user._id,
    });
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


/**
 * Resolve hazard and apply related workflow updates.
 */
exports.resolve = async (req, res) => {
  try {
    const doc = await hazardService.resolve({
      id: req.params.id,
      resolutionNote: req.body?.resolutionNote,
      actorId: req.user._id,
    });
    res.json(doc);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};




/**
 * Delete hazard (allowed only when business rules are satisfied).
 */
exports.remove = async (req, res) => {
  try {
    const result = await hazardService.deleteIfAllowed({ id: req.params.id });
    res.json({ message: "Deleted", ...result });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};