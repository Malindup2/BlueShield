// this is the Routes file for the Report model, which will handle all the API endpoints related to reports.

const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const v = require("../validations/report.validation");  

const ctrl = require("../controllers/reportController");

// CRUD operations for reports 

// need to figure out the Authroization level for this CRUD (officer, fisherman and system_admin has the privilege to create a report, but only officer and system_admin can update or delete a report)
router.post("/", protect, authorize("FISHERMAN","OFFICER", "SYSTEM_ADMIN"), validate(v.create), ctrl.create);
router.get("/", protect, authorize("FISHERMAN","OFFICER", "SYSTEM_ADMIN", "ILLEGAL_ADMIN"), ctrl.list);
router.get("/:reportId", protect, authorize("FISHERMAN","OFFICER", "SYSTEM_ADMIN", "ILLEGAL_ADMIN"), validate(v.getById), ctrl.getById);
router.patch("/:reportId", protect, authorize("FISHERMAN","OFFICER", "SYSTEM_ADMIN"), validate(v.update), ctrl.update);
router.delete("/:reportId", protect, validate(v.getById), ctrl.remove); 
//only system_admin can delete a report, but officer and fisherman can update a report (e.g. change the status of the report or add more details to the report)


module.exports = router;

//test

