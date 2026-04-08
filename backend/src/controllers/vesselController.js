const axios = require("axios");
const Report = require("../models/Report");
const vesselTrackerService = require("../services/vesselTrackerService");

/**
 * Create a new vessel record
 * @route POST /api/vessels
 * @access Public
 */
exports.createVessel = async (req, res) => {
  try {
    // Placeholder for future vessel creation logic
    res.status(201).json({ message: "Vessel creation not yet implemented" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all vessels
 * @route GET /api/vessels
 * @access Public
 */
exports.getVessels = async (req, res) => {
  try {
    // Placeholder for future get all vessels logic
    res.status(200).json({ vessels: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get vessels within a geographic zone
 * @route GET /api/vessels/zone?minlat={minlat}&maxlat={maxlat}&minlon={minlon}&maxlon={maxlon}&minutesBack={minutesBack}
 * @access Public
 * @query {number} minlat - Minimum latitude (required)
 * @query {number} maxlat - Maximum latitude (required)
 * @query {number} minlon - Minimum longitude (required)
 * @query {number} maxlon - Maximum longitude (required)
 * @query {number} minutesBack - Maximum age of position in minutes (optional, default: 60)
 */
exports.getVesselsInZone = async (req, res) => {
  try {
    const { minlat, maxlat, minlon, maxlon, minutesBack } = req.query;

    // Validate required parameters
    if (!minlat || !maxlat || !minlon || !maxlon) {
      return res.status(400).json({
        message: "All bounding box coordinates (minlat, maxlat, minlon, maxlon) are required",
      });
    }

    // Validate that coordinates are numbers
    const minLat = parseFloat(minlat);
    const maxLat = parseFloat(maxlat);
    const minLon = parseFloat(minlon);
    const maxLon = parseFloat(maxlon);
    const minutes = minutesBack ? parseInt(minutesBack, 10) : 60;

    if (isNaN(minLat) || isNaN(maxLat) || isNaN(minLon) || isNaN(maxLon)) {
      return res.status(400).json({
        message: "All coordinates must be valid numbers",
      });
    }

    // Validate coordinate ranges
    if (minLat < -90 || maxLat > 90 || minLat > maxLat) {
      return res.status(400).json({
        message: "Invalid latitude range: minlat must be <= maxlat and both between -90 and 90",
      });
    }

    if (minLon < -180 || maxLon > 180 || minLon > maxLon) {
      return res.status(400).json({
        message: "Invalid longitude range: minlon must be <= maxlon and both between -180 and 180",
      });
    }

    if (minutes < 1 || minutes > 1440) {
      return res.status(400).json({
        message: "minutesBack must be between 1 and 1440",
      });
    }

    // Fetch vessels in the zone from the tracker service
    const vessels = await vesselTrackerService.getVesselsInZone(
      minLat,
      maxLat,
      minLon,
      maxLon,
      minutes
    );

    res.status(200).json({
      success: true,
      count: vessels.length,
      data: vessels,
    });
  } catch (error) {
    console.error("Error in getVesselsInZone:", error);
    res.status(500).json({
      message: "Error fetching vessels in zone",
      error: error.message,
    });
  }
};