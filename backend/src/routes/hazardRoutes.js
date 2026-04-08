const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const v = require("../validations/hazard.validation");

const hazardCtrl = require("../controllers/hazardController");



router.get(
  "/review-reports",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  hazardCtrl.listReviewReports
);

router.get(
  "/review-reports/:reportId",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  hazardCtrl.getReviewReportById
);

router.patch(
  "/review-reports/:reportId/status",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  hazardCtrl.updateReviewReportStatus
);

// Create hazard from report
router.post(
  "/from-report/:reportId",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  validate(v.fromReport),
  hazardCtrl.createFromReport
);


router.post(
  "/weather-check",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  hazardCtrl.weatherByLocation
);


router.get(
  "/dashboard-summary",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  hazardCtrl.dashboardSummary
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


// Weather check (Open-Meteo)
router.get(
  "/:id/weather",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  validate(v.weather),
  hazardCtrl.weather
);



// Resolve hazard (disable zones + resolve report)
router.patch(
  "/:id/resolve",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  validate(v.resolve),
  hazardCtrl.resolve
);


// Delete a hazardrecord
router.delete(
  "/:id",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  validate(v.getById),
  hazardCtrl.remove
);

module.exports = router;