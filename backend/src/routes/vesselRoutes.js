const express = require("express");
const router = express.Router();
const vesselController = require("../controllers/vesselController");

// Create a new vessel
router.post("/", vesselController.createVessel);

// Get all vessels
router.get("/", vesselController.getVessels);

// Get nearby vessels by location (lat, lng)
// Usage: GET /api/vessels/nearby?lat=6.9271&lng=79.8612&radius=50
router.get("/nearby", vesselController.getNearbyVessels);

module.exports = router;