const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { translate } = require("../controllers/translationController");

// POST /api/translate
// Protected — user must be logged in (any role can use translation)
router.post("/", protect, translate);

module.exports = router;