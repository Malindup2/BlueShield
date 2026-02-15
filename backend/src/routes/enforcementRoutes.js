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
router.delete("/:enforcementId/actions/:actionId", protect, authorize("OFFICER", "SYSTEM_ADMIN"), validate(v.deleteAction), ctrl.deleteAction);

// External API feature (AI)
router.post(
  "/:enforcementId/risk-score",
  protect,
  authorize("OFFICER", "SYSTEM_ADMIN"),
  validate(v.getById),
  ctrl.generateRiskScore
);

module.exports = router;
