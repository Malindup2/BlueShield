/**
 * Zone request validators
 * - Centralizes request validation rules for zones
 * - Returns { error: string[] | null } for middleware
 */

const isObjectId = (v) => typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);

const ZONE_STATUS = ["ACTIVE", "DISABLED"];
const ZONE_TYPES = ["RESTRICTED", "DANGEROUS"];

/**
 * Validate longitude/latitude array [lng, lat].
 */
const isLngLat = (arr) =>
  Array.isArray(arr) &&
  arr.length === 2 &&
  typeof arr[0] === "number" &&
  typeof arr[1] === "number" &&
  arr[0] >= -180 &&
  arr[0] <= 180 &&
  arr[1] >= -90 &&
  arr[1] <= 90;

/**
 * Validate zone creation payload.
 * Center is no longer required from the frontend.
 * It will be derived from the linked hazard's report location.
 */
exports.create = (req) => {
  const errors = [];
  const body = req.body || {};

  if (!body.sourceHazard || !isObjectId(body.sourceHazard)) {
    errors.push("sourceHazard is required (ObjectId)");
  }

  if (!body.zoneType || !ZONE_TYPES.includes(body.zoneType)) {
    errors.push("zoneType must be RESTRICTED or DANGEROUS");
  }

  if (!body.warningMessage || typeof body.warningMessage !== "string" || !body.warningMessage.trim()) {
    errors.push("warningMessage is required (string)");
  }

  if (typeof body.radius !== "number" || body.radius < 10 || body.radius > 50000) {
    errors.push("radius must be a number between 10 and 50000 meters");
  }

  return { error: errors.length ? errors : null };
};

/**
 * Validate zone list query parameters.
 */
exports.list = (req) => {
  const errors = [];
  const q = req.query || {};

  const page = parseInt(q.page || "1", 10);
  const limit = parseInt(q.limit || "10", 10);
  if (Number.isNaN(page) || page < 1) errors.push("page must be >= 1");
  if (Number.isNaN(limit) || limit < 1 || limit > 50) errors.push("limit must be 1..50");

  if (q.status && !ZONE_STATUS.includes(q.status)) errors.push("Invalid status");
  if (q.zoneType && !ZONE_TYPES.includes(q.zoneType)) errors.push("Invalid zoneType");

  return { error: errors.length ? errors : null };
};

/**
 * Validate zone id parameter.
 */
exports.getById = (req) => {
  const errors = [];
  if (!isObjectId(req.params.id)) errors.push("id must be a valid ObjectId");
  return { error: errors.length ? errors : null };
};

/**
 * Validate zone update payload.
 * Center remains optional for backend flexibility.
 */
exports.update = (req) => {
  const errors = [];
  if (!isObjectId(req.params.id)) errors.push("id must be a valid ObjectId");

  const body = req.body || {};
  if (body.zoneType && !ZONE_TYPES.includes(body.zoneType)) errors.push("Invalid zoneType");
  if (body.status && !ZONE_STATUS.includes(body.status)) errors.push("Invalid status");

  if (body.warningMessage != null) {
    if (typeof body.warningMessage !== "string" || !body.warningMessage.trim()) {
      errors.push("warningMessage must be string");
    }
  }

  if (body.center && !isLngLat(body.center)) {
    errors.push("center must be [lng, lat] numbers");
  }

  if (body.radius != null && (typeof body.radius !== "number" || body.radius < 10 || body.radius > 50000)) {
    errors.push("radius must be a number between 10 and 50000 meters");
  }

  return { error: errors.length ? errors : null };
};