const zoneService = require("../services/zoneService");


/**
 * Create a zone for a hazard (one zone per hazard).
 */
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


/**
 * List zones (supports pagination/filters and returns GeoJSON for map).
 */
exports.list = async (req, res) => {
  try {
    const result = await zoneService.list({ query: req.query });
    res.json(result);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};



/**
 * Get a single zone by id.
 */
exports.getById = async (req, res) => {
  try {
    const doc = await zoneService.getById(req.params.id);
    res.json(doc);
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};


/**
 * Update zone fields (status/type/message/center/radius).
 */
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

/**
 * Delete a zone.
 */
exports.remove = async (req, res) => {
  try {
    const deleted = await zoneService.remove({ id: req.params.id });
    res.json({ message: "Deleted", id: deleted._id });
  } catch (e) {
    res.status(e.statusCode || 500).json({ message: e.message });
  }
};
