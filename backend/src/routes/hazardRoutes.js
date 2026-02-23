const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const v = require("../validations/hazard.validation");

const hazardCtrl = require("../controllers/hazardController");



// Create hazard from report
router.post(
  "/from-report/:reportId",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  validate(v.fromReport),
  hazardCtrl.createFromReport
);

// List hazards
router.get(
  "/",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  validate(v.list),
  hazardCtrl.list
);


// Get hazard
router.get(
  "/:id",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  validate(v.getById),
  hazardCtrl.getById
);

// Update hazard
router.patch(
  "/:id",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  validate(v.update),
  hazardCtrl.update
);


module.exports = router;