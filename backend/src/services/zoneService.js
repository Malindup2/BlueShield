const Zone = require("../models/Zone");



exports.create = async ({ payload, actorId }) => {
  const existing = await Zone.findOne({ sourceHazard: payload.sourceHazard });
  if (existing) {
    const err = new Error("Zone already exists for this hazard. Use PATCH to update it.");
    err.statusCode = 409;
    throw err;
  }

  const doc = await Zone.create({
    sourceHazard: payload.sourceHazard,
    zoneType: payload.zoneType,
    warningMessage: payload.warningMessage,
    status: "ACTIVE",
    center: { type: "Point", coordinates: payload.center },
    radius: payload.radius,
    expiresAt: payload.expiresAt || null,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return doc;
};
