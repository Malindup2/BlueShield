// this is the Routes file for the Report model, which will handle all the API endpoints related to reports.

const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const { uploadEvidence } = require("../middlewares/upload");
const v = require("../validations/report.validation");  

const ctrl = require("../controllers/reportController");

// Parse JSON string fields sent via FormData before validation
const parseFormData = (req, res, next) => {
  if (typeof req.body.location === "string") {
    try { req.body.location = JSON.parse(req.body.location); } catch { /* leave as-is */ }
  }
  if (typeof req.body.vessel === "string") {
    try { req.body.vessel = JSON.parse(req.body.vessel); } catch { /* leave as-is */ }
  }
  if (typeof req.body.isAnonymous === "string") {
    req.body.isAnonymous = req.body.isAnonymous === "true";
  }
  next();
};

// CRUD operations for reports

// need to figure out the Authroization level for this CRUD (officer, fisherman and system_admin has the privilege to create a report, but only officer and system_admin can update or delete a report)
router.post("/", protect, authorize("FISHERMAN","OFFICER", "SYSTEM_ADMIN"), uploadEvidence, parseFormData, validate(v.create), ctrl.create);
router.get("/my", protect, authorize("FISHERMAN","OFFICER", "SYSTEM_ADMIN"), ctrl.listMine);
router.get("/", protect, authorize("FISHERMAN","OFFICER", "SYSTEM_ADMIN", "ILLEGAL_ADMIN"), ctrl.list);
router.get("/:reportId", protect, authorize("FISHERMAN","OFFICER", "SYSTEM_ADMIN", "ILLEGAL_ADMIN"), validate(v.getById), ctrl.getById);
router.patch("/:reportId", protect, authorize("FISHERMAN","OFFICER", "SYSTEM_ADMIN"), validate(v.update), ctrl.update);
router.delete("/:reportId", protect, validate(v.getById), ctrl.remove); 
//only system_admin can delete a report, but officer and fisherman can update a report (e.g. change the status of the report or add more details to the report)


module.exports = router;