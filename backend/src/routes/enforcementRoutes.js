const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const v = require("../validations/enforcement.validation");

const ctrl = require("../controllers/enforcementController");

// CRUD
router.post("/", protect, authorize("OFFICER", "SYSTEM_ADMIN"), validate(v.create), ctrl.create);
router.get("/", protect, authorize("OFFICER", "SYSTEM_ADMIN", "ILLEGAL_ADMIN"), ctrl.list);
router.get("/:enforcementId", protect, authorize("OFFICER", "SYSTEM_ADMIN", "ILLEGAL_ADMIN"), validate(v.getById), ctrl.getById);
router.patch("/:enforcementId", protect, authorize("OFFICER", "SYSTEM_ADMIN"), validate(v.update), ctrl.update);
router.delete("/:enforcementId", protect, authorize("SYSTEM_ADMIN"), validate(v.getById), ctrl.remove);

// Workflow helpers
router.post("/from-case/:caseId", protect, authorize("OFFICER", "SYSTEM_ADMIN"), validate(v.fromCase), ctrl.createFromCase);

// Actions log
router.post("/:enforcementId/actions", protect, authorize("OFFICER", "SYSTEM_ADMIN"), validate(v.addAction), ctrl.addAction);
router.patch("/:enforcementId/actions/:actionId", protect, authorize("OFFICER", "SYSTEM_ADMIN"), validate(v.updateAction), ctrl.updateAction);
router.delete("/:enforcementId/actions/:actionId", protect, authorize("OFFICER", "SYSTEM_ADMIN"), validate(v.deleteAction), ctrl.deleteAction);

// Close enforcement with outcome
router.patch(
  "/:enforcementId/close",
  protect,
  authorize("OFFICER", "SYSTEM_ADMIN"),
  validate(v.close),
  ctrl.close
);

// External API feature (AI) - Gemini risk score
router.post(
  "/:enforcementId/risk-score",
  protect,
  authorize("OFFICER", "SYSTEM_ADMIN"),
  validate(v.getById),
  ctrl.generateRiskScore
);

// EVIDENCE ROUTES - Separate Model (like Sanduni's Zone pattern)
// Get all evidence items for an enforcement
router.get(
  "/:enforcementId/evidence",
  protect,
  authorize("OFFICER", "SYSTEM_ADMIN", "ILLEGAL_ADMIN"),
  validate(v.getById),
  ctrl.getEvidence
);

// Add new evidence item
router.post(
  "/:enforcementId/evidence",
  protect,
  authorize("OFFICER", "SYSTEM_ADMIN"),
  validate(v.addEvidence),
  ctrl.addEvidence
);

// Update existing evidence item
router.patch(
  "/:enforcementId/evidence/:evidenceId",
  protect,
  authorize("OFFICER", "SYSTEM_ADMIN"),
  validate(v.updateEvidence),
  ctrl.updateEvidence
);

// Delete evidence item
router.delete(
  "/:enforcementId/evidence/:evidenceId",
  protect,
  authorize("OFFICER", "SYSTEM_ADMIN"),
  validate(v.deleteEvidence),
  ctrl.deleteEvidence
);

// TEAM ROUTES - Separate Model (like Minuli's CaseReviewd pattern)
// Get all team members for an enforcement
router.get(
  "/:enforcementId/team",
  protect,
  authorize("OFFICER", "SYSTEM_ADMIN", "ILLEGAL_ADMIN"),
  validate(v.getById),
  ctrl.getTeam
);

// Add new team member
router.post(
  "/:enforcementId/team",
  protect,
  authorize("OFFICER", "SYSTEM_ADMIN"),
  validate(v.addTeamMember),
  ctrl.addTeamMember
);

// Update team member
router.patch(
  "/:enforcementId/team/:memberId",
  protect,
  authorize("OFFICER", "SYSTEM_ADMIN"),
  validate(v.updateTeamMember),
  ctrl.updateTeamMember
);

// Delete team member
router.delete(
  "/:enforcementId/team/:memberId",
  protect,
  authorize("OFFICER", "SYSTEM_ADMIN"),
  validate(v.deleteTeamMember),
  ctrl.deleteTeamMember
);

module.exports = router;
