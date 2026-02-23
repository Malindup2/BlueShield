// this is the Routes file for the Report model, which will handle all the API endpoints related to reports.

const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const v = require("../validations/report.validation");  

const ctrl = require("../controllers/reportController");

// CRUD
router.post("/", protect, validate(v.create), ctrl.create);
router.get("/", protect, ctrl.list);
router.get("/:reportId", protect, validate(v.getById), ctrl.getById);
router.patch("/:reportId", protect, validate(v.update), ctrl.update);
router.delete("/:reportId", protect, validate(v.getById), ctrl.remove);

module.exports = router;

