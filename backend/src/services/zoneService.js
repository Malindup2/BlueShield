/**
 * Zone service
 * - Manages zones linked to hazards
 * - Returns GeoJSON output for map consumption
 * - Zone center is derived automatically from the linked hazard's base report location
 */

const Zone = require("../models/Zone");
const Hazard = require("../models/Hazard");

// Convert zone list to GeoJSON for map rendering
const toGeoJSON = (zones) => ({
  type: "FeatureCollection",
  features: zones.map((z) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: z.center.coordinates },
    properties: {
      zoneId: z._id,
      zoneType: z.zoneType,
      status: z.status,
      radius: z.radius,
      warningMessage: z.warningMessage,
      expiresAt: z.expiresAt,
      createdAt: z.createdAt,

      caseId: z.sourceHazard?.caseId,
      hazardCategory: z.sourceHazard?.hazardCategory,
      severity: z.sourceHazard?.severity,
      handlingStatus: z.sourceHazard?.handlingStatus,
    },
  })),
});

/**
 * Create a zone for a hazard.
 * - One zone per hazard
 * - Center auto-derived from hazard.baseReport.location.coordinates
 */
exports.create = async ({ payload, actorId }) => {
  const existing = await Zone.findOne({ sourceHazard: payload.sourceHazard });
  if (existing) {
    const err = new Error("Zone already exists for this hazard. Use PATCH to update it.");
    err.statusCode = 409;
    throw err;
  }

  const hazard = await Hazard.findById(payload.sourceHazard).populate("baseReport");
  if (!hazard) {
    const err = new Error("Linked hazard not found");
    err.statusCode = 404;
    throw err;
  }

  const coords = hazard?.baseReport?.location?.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2) {
    const err = new Error("Linked report does not contain valid coordinates for zone center");
    err.statusCode = 400;
    throw err;
  }

  const doc = await Zone.create({
    sourceHazard: payload.sourceHazard,
    zoneType: payload.zoneType,
    warningMessage: payload.warningMessage,
    status: "ACTIVE",
    center: { type: "Point", coordinates: coords },
    radius: payload.radius,
    expiresAt: payload.expiresAt || null,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return doc;
};

/**
 * List zones with pagination and filters.
 */
exports.list = async ({ query }) => {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) filter.status = query.status;
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
      .populate("sourceHazard", "caseId hazardCategory severity handlingStatus"),
    Zone.countDocuments(filter),
  ]);

  return { page, limit, total, items, geojson: toGeoJSON(items) };
};

/**
 * Get a single zone by id.
 */
exports.getById = async (id) => {
  const doc = await Zone.findById(id).populate(
    "sourceHazard",
    "caseId hazardCategory severity handlingStatus"
  );

  if (!doc) {
    const err = new Error("Zone not found");
    err.statusCode = 404;
    throw err;
  }
  return doc;
};

/**
 * Update editable zone fields only.
 */
exports.update = async ({ id, payload, actorId }) => {
  const updateDoc = {
    $set: {
      zoneType: payload.zoneType,
      warningMessage: payload.warningMessage,
      status: payload.status,
      radius: payload.radius,
      expiresAt: payload.expiresAt || null,
      updatedBy: actorId,
    },
  };

  Object.keys(updateDoc.$set).forEach((key) => {
    if (updateDoc.$set[key] === undefined) {
      delete updateDoc.$set[key];
    }
  });

  const updated = await Zone.findByIdAndUpdate(id, updateDoc, {
    new: true,
    runValidators: true,
  }).populate("sourceHazard", "caseId hazardCategory severity handlingStatus");

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