// upon filing a report of a vessel, the third party vessel tracker API is called to get the current location of the vessel and store it in the database. This service is responsible for calling the third party API and storing the location data in the database.

const axios = require("axios");
const Report = require("../models/Report");

const VESSEL_TRACKER_API_URL = "https://api.vesseltracker.com/v1/vessels";
const VESSEL_TRACKER_API_KEY = process.env.VESSEL_TRACKER_API_KEY;

exports.trackVessel = async (reportId, vesselName) => {
    try {
        const response = await axios.get(`${VESSEL_TRACKER_API_URL}?name=${encodeURIComponent(vesselName)}`, {
            headers: {
                "Authorization": `Bearer ${VESSEL_TRACKER_API_KEY}`
            }
        });
        const vesselData = response.data;

        // Update the report with the vessel's current location
        await Report.findByIdAndUpdate(reportId, {
            $set: {
                vesselLocation: vesselData.location
            }
        });

        return vesselData;
    } catch (error) {
        console.error("Error tracking vessel:", error);
        throw new Error("Failed to track vessel");
    }
};