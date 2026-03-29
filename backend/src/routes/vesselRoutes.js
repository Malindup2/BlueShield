import express from "express";
import router from express.Router();
import { createVessel, getVessels } from "../controllers/vesselController.js";

// Create a new vessel
router.post("/", createVessel);

// Get all vessels
router.get("/", getVessels);        

router.get("/nearby", vesselController.getNearbyVessels);

export default router;