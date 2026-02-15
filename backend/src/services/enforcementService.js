const Enforcement = require("../models/Enforcement");
const IllegalCase = require("../models/IllegalCase");

exports.create = async ({ relatedCase, leadOfficer, actorId }) => {
  // one enforcement per case (your schema has unique)
  const existing = await Enforcement.findOne({ relatedCase });
  if (existing) {
    const err = new Error("Enforcement already exists for this case");
    err.statusCode = 409;
    throw err;
  }

  // ensure case exists
  const theCase = await IllegalCase.findById(relatedCase);
  if (!theCase) {
    const err = new Error("IllegalCase not found");
    err.statusCode = 404;
    throw err;
  }

  return Enforcement.create({
    relatedCase,
    leadOfficer,
    updatedBy: actorId,
  });
};

exports.createFromCase = async ({ caseId, officerId }) => {
  return exports.create({ relatedCase: caseId, leadOfficer: officerId, actorId: officerId });
};

exports.list = async ({ query }) => {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 50);
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) filter.status = query.status;

  const sort = query.sort || "-createdAt";

  const [items, total] = await Promise.all([
    Enforcement.find(filter).sort(sort).skip(skip).limit(limit),
    Enforcement.countDocuments(filter),
  ]);

  return { page, limit, total, items };
};

exports.getById = async (enforcementId) => {
  const doc = await Enforcement.findById(enforcementId)
    .populate({
      path: "relatedCase",
      populate: { path: "baseReport" },
    })
    .populate("leadOfficer", "name email role");

  if (!doc) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return doc;
};

exports.update = async ({ enforcementId, payload, actorId }) => {
  const updated = await Enforcement.findByIdAndUpdate(
    enforcementId,
    { ...payload, updatedBy: actorId },
    { new: true, runValidators: true }
  );

  if (!updated) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

exports.delete = async ({ enforcementId }) => {
  const deleted = await Enforcement.findByIdAndDelete(enforcementId);
  if (!deleted) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return deleted;
};

exports.addAction = async ({ enforcementId, action, actorId }) => {
  const updated = await Enforcement.findByIdAndUpdate(
    enforcementId,
    { $push: { actions: action }, updatedBy: actorId },
    { new: true, runValidators: true }
  );

  if (!updated) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

exports.deleteAction = async ({ enforcementId, actionId, actorId }) => {
  const updated = await Enforcement.findByIdAndUpdate(
    enforcementId,
    { $pull: { actions: { _id: actionId } }, updatedBy: actorId },
    { new: true }
  );

  if (!updated) {
    const err = new Error("Enforcement not found");
    err.statusCode = 404;
    throw err;
  }
  return updated;
};
