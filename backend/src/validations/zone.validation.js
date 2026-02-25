const isObjectId = (v) => typeof v === "string" && /^[a-fA-F0-9]{24}$/.test(v);

const ZONE_STATUS = ["ACTIVE", "DISABLED"];
const ZONE_TYPES = ["RESTRICTED", "DANGEROUS"];

const isLngLat = (arr) =>
  Array.isArray(arr) &&
  arr.length === 2 &&
  typeof arr[0] === "number" &&
  typeof arr[1] === "number" &&
  arr[0] >= -180 &&
  arr[0] <= 180 &&
  arr[1] >= -90 &&
  arr[1] <= 90;

exports.create = (req) => {
  const errors = [];
  const body = req.body || {};

  if (!body.sourceHazard || !isObjectId(body.sourceHazard)) errors.push("sourceHazard is required (ObjectId)");
  if (!body.zoneType || !ZONE_TYPES.includes(body.zoneType)) errors.push("zoneType must be RESTRICTED or DANGEROUS");

  if (!body.warningMessage || typeof body.warningMessage !== "string" || !body.warningMessage.trim()) {
    errors.push("warningMessage is required (string)");
  }

  if (!isLngLat(body.center)) errors.push("center must be [lng, lat] numbers");
  if (typeof body.radius !== "number" || body.radius < 10 || body.radius > 50000) {
    errors.push("radius must be a number between 10 and 50000 meters");
  }

  return { error: errors.length ? errors : null };
};
