const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const v = require("../validations/zone.validation");

const zonectrl = require("../controllers/zoneController");

// Create a zone for a hazard
router.post(
  "/",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  validate(v.create),
  zonectrl.create
);


// List zones (GeoJSON for map)
router.get(
  "/",
  protect, 
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN", "FISHERMAN", "OFFICER"),
  validate(v.list),
  zonectrl.list
);


// Get zone by id
router.get(
  "/:id",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  validate(v.getById),
  zonectrl.getById
);


// Update zone 
router.patch(
  "/:id",
  protect,
  authorize("HAZARD_ADMIN", "SYSTEM_ADMIN"),
  validate(v.update),
  zonectrl.update
);


// Delete zone 
router.delete(
  "/:id",
  protect,
  authorize("HAZARD_ADMIN","SYSTEM_ADMIN"),
  validate(v.getById),
  zonectrl.remove
);



module.exports = router;