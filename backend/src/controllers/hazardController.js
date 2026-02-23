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


// get one hazard record using id 
exports.getById = async (req, res) => {
  try {
    const doc = await hazardService.getById(req.params.id);
    res.json(doc);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};



// update an existing hazard record
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


//check current weather condition
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