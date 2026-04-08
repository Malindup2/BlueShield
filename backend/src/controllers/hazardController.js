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




exports.listReviewReports = async (req, res) => {
  try {
    const result = await hazardService.listReviewReports({ query: req.query });
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.getReviewReportById = async (req, res) => {
  try {
    const result = await hazardService.getReviewReportById(req.params.reportId);
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};

exports.updateReviewReportStatus = async (req, res) => {
  try {
    const result = await hazardService.updateReviewReportStatus({
      reportId: req.params.reportId,
      payload: req.body,
      actorId: req.user._id,
    });
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


/**
 * Fetch marine/weather snapshot directly by coordinates
 * POST /api/hazards/weather-check
 */
exports.weatherByLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body || {};

    if (typeof lat !== "number" || Number.isNaN(lat)) {
      return res.status(400).json({ message: "lat is required and must be a valid number" });
    }

    if (typeof lng !== "number" || Number.isNaN(lng)) {
      return res.status(400).json({ message: "lng is required and must be a valid number" });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({ message: "lat must be between -90 and 90" });
    }

    if (lng < -180 || lng > 180) {
      return res.status(400).json({ message: "lng must be between -180 and 180" });
    }

    const marineService = require("../services/marineService");
    const result = await marineService.fetchMarineConditions({ lat, lng });

    return res.json(result);
  } catch (e) {
    return res.status(e.statusCode || 500).json({
      message: e.message || "Failed to fetch marine conditions",
    });
  }
};



exports.dashboardSummary = async (req, res) => {
  try {
    const result = await hazardService.getDashboardSummary();
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message || "Failed to load dashboard summary" });
  }
};