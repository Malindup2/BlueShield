/**
 * Zone service
 * - Manages zones linked to hazards
 * - Returns GeoJSON output for map consumption
 */

const Zone = require("../models/Zone");


// Convert zone list to a minimal GeoJSON FeatureCollection for map renderin
const toGeoJSON = (zones) => ({
  type: "FeatureCollection",
  features: zones.map((z) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: z.center.coordinates },
    properties: {
      zoneId: z._id,
      zoneType: z.zoneType,
      radius: z.radius,
      warningMessage: z.warningMessage,
      expiresAt: z.expiresAt,
      createdAt: z.createdAt,

      hazardCategory: z.sourceHazard?.hazardCategory,
      severity: z.sourceHazard?.severity,
    },
  })),
});


/**
 * Create a zone for a hazard.
 * Rules enforced here:
 * - One zone per hazard (sourceHazard unique)
 */
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



/**
 * List zones with pagination and filters.
 * Returns both items and a GeoJSON version for map rendering.
 */
exports.list = async ({ query }) => {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 50);
  const skip = (page - 1) * limit;

  const filter = {};
  filter.status = query.status || "ACTIVE";
  if (query.zoneType) filter.zoneType = query.zoneType;

  if (!query.includeExpired) {
    filter.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];
  }

  const sort = query.sort || "-createdAt";

  const [items, total] = await Promise.all([
    Zone.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("sourceHazard", "hazardCategory severity"),
    Zone.countDocuments(filter),
  ]);

  return { page, limit, total, items, geojson: toGeoJSON(items) };
};



/**
 * Get a single zone by id.
 */
exports.getById = async (id) => {
  const doc = await Zone.findById(id).populate("sourceHazard", "hazardCategory severity");
  if (!doc) {
    const err = new Error("Zone not found");
    err.statusCode = 404;
    throw err;
  }
  return doc;
};


/**
 * Update zone fields.
 * If center is provided, it is stored as a GeoJSON Point.
 */
exports.update = async ({ id, payload, actorId }) => {
  const updateDoc = { $set: { ...payload, updatedBy: actorId } };
  if (payload.center) updateDoc.$set.center = { type: "Point", coordinates: payload.center };

  const updated = await Zone.findByIdAndUpdate(id, updateDoc, { new: true, runValidators: true });
  if (!updated) {
    const err = new Error("Zone not found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
};


/**
 * Delete a zone by id.
 */
exports.remove = async ({ id }) => {
  const deleted = await Zone.findByIdAndDelete(id);
  if (!deleted) {
    const err = new Error("Zone not found");
    err.statusCode = 404;
    throw err;
  }
  return deleted;
};