const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const v = require("../validations/illegalCase.validation");
const ctrl = require("../controllers/illegalCaseController");

const illegalAdminRoles = ["ILLEGAL_ADMIN", "SYSTEM_ADMIN"];

// Dashboard
router.get("/reports/pending", protect, authorize(...illegalAdminRoles), ctrl.getPendingReports);
router.patch("/reports/:reportId/mark-reviewed", protect, authorize(...illegalAdminRoles), validate(v.reportId), ctrl.markAsReviewed);
router.delete("/reports/:reportId", protect, authorize(...illegalAdminRoles), validate(v.reportId), ctrl.deleteReviewedCase);

// Officers dropdown
router.get("/officers", protect, authorize(...illegalAdminRoles), ctrl.getOfficers);

// Case records CRUD
router.post("/reports/:reportId/review", protect, authorize(...illegalAdminRoles), validate(v.createCase), ctrl.createCase);
router.get("/", protect, authorize(...illegalAdminRoles), ctrl.listCases);
router.get("/:caseId", protect, authorize(...illegalAdminRoles), validate(v.caseId), ctrl.getCaseById);
router.patch("/:caseId", protect, authorize(...illegalAdminRoles), validate(v.updateCase), ctrl.updateCase);
router.delete("/:caseId", protect, authorize(...illegalAdminRoles), validate(v.caseId), ctrl.deleteCase);

// Actions
router.post("/:caseId/escalate", protect, authorize(...illegalAdminRoles), validate(v.escalateCase), ctrl.escalateCase);
router.post("/:caseId/resolve", protect, authorize("OFFICER", "SYSTEM_ADMIN", ...illegalAdminRoles), validate(v.caseId), ctrl.resolveCase);
router.post("/:caseId/track", protect, authorize(...illegalAdminRoles), validate(v.caseId), ctrl.trackVessel);
router.post("/:caseId/notes", protect, authorize(...illegalAdminRoles), validate(v.addNote), ctrl.addNote);

module.exports = router;