const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const v = require("../validations/illegalCase.validation");

const ctrl = require("../controllers/illegalCaseController");

// Both ILLEGAL_ADMIN and SYSTEM_ADMIN can access all routes in this component
const illegalAdminRoles = ["ILLEGAL_ADMIN", "SYSTEM_ADMIN"];


// get all ILLEGAL_FISHING reports 
router.get(
  "/reports/pending",
  protect,
  authorize(...illegalAdminRoles),
  ctrl.getPendingReports
);

//  mark a report as reviewed 
router.patch(
  "/reports/:reportId/mark-reviewed",
  protect,
  authorize(...illegalAdminRoles),
  validate(v.reportId),
  ctrl.markAsReviewed
);

// delete remove a reviewed case
router.delete(
  "/reports/:reportId",
  protect,
  authorize(...illegalAdminRoles),
  validate(v.reportId),
  ctrl.deleteReviewedCase
);



// get all OFFICER users for assigning a specific officer 
router.get(
  "/officers",
  protect,
  authorize(...illegalAdminRoles),
  ctrl.getOfficers
);


// create a new illegal case review record 
router.post(
  "/reports/:reportId/review",
  protect,
  authorize(...illegalAdminRoles),
  validate(v.createCase),
  ctrl.createCase
);

//get all illegal case review records 
router.get(
  "/",
  protect,
  authorize(...illegalAdminRoles),
  ctrl.listCases
);

//get single illegal case review record 
router.get(
  "/:caseId",
  protect,
  authorize(...illegalAdminRoles),
  validate(v.caseId),
  ctrl.getCaseById
);

// update a case record — only allowed when status is OPEN
router.patch(
  "/:caseId",
  protect,
  authorize(...illegalAdminRoles),
  validate(v.updateCase),
  ctrl.updateCase
);

//delete a case record — allowed when OPEN or RESOLVED, blocked when ESCALATED
router.delete(
  "/:caseId",
  protect,
  authorize(...illegalAdminRoles),
  validate(v.caseId),
  ctrl.deleteCase
);


// escalate a case — assigns officer + sets status to ESCALATED

router.post(
  "/:caseId/escalate",
  protect,
  authorize(...illegalAdminRoles),
  validate(v.escalateCase),
  ctrl.escalateCase
);



// trigger vessel tracking via external API 
router.post(
  "/:caseId/track",
  protect,
  authorize(...illegalAdminRoles),
  validate(v.caseId),
  ctrl.trackVessel
);



// add a reference note 
router.post(
  "/:caseId/notes",
  protect,
  authorize(...illegalAdminRoles),
  validate(v.addNote),
  ctrl.addNote
);

module.exports = router;