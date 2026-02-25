const zoneService = require("../services/zoneService");


exports.create = async (req, res) => {
  try {
    const doc = await zoneService.create({
      payload: req.body,
      actorId: req.user._id,
    });
    res.status(201).json(doc);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};



exports.list = async (req, res) => {
  try {
    const result = await zoneService.list({ query: req.query });
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};



exports.getById = async (req, res) => {
  try {
    const doc = await zoneService.getById(req.params.id);
    res.json(doc);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};



exports.update = async (req, res) => {
  try {
    const doc = await zoneService.update({
      id: req.params.id,
      payload: req.body,
      actorId: req.user._id,
    });
    res.json(doc);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


exports.remove = async (req, res) => {
  try {
    const deleted = await zoneService.remove({ id: req.params.id });
    res.json({ message: "Deleted", id: deleted._id });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};
