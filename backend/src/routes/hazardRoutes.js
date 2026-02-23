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



module.exports = router;