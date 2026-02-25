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