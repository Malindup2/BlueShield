const hazardService = require("../services/hazardService");

//create a hazard record from a verified hazard category report 
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

//list all hazard cases
exports.list = async (req, res) => {
  try {
    const result = await hazardService.list({ query: req.query });
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};
