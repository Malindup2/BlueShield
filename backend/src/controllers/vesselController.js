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
 * Get nearby vessels at a specific location
 * @route GET /api/vessels/nearby?lat={latitude}&lng={longitude}&radius={radiusKm}
 * @access Public
 * @query {number} lat - Latitude coordinate (required)
 * @query {number} lng - Longitude coordinate (required)
 * @query {number} radius - Search radius in kilometers (optional, default: 50)
 */
exports.getNearbyVessels = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({
        message: "Latitude (lat) and longitude (lng) parameters are required",
      });
    }

    // Validate that lat and lng are numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = radius ? parseFloat(radius) : 50;

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        message: "Latitude and longitude must be valid numbers",
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        message: "Latitude must be between -90 and 90",
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        message: "Longitude must be between -180 and 180",
      });
    }

    // Fetch nearby vessels from the tracker service
    const vessels = await vesselTrackerService.getNearbyVessels(
      latitude,
      longitude,
      radiusKm
    );

    res.status(200).json({
      success: true,
      count: vessels.length,
      data: vessels,
    });
  } catch (error) {
    console.error("Error in getNearbyVessels:", error);
    res.status(500).json({
      message: "Error fetching nearby vessels",
      error: error.message,
    });
  }
};