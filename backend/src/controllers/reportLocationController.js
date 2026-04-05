//this is the controller for the report location tagging service. It handles the API requests related to tagging a report with a location and retrieving the location information for a report.

const Report = require("../models/Report");
const { getLocationFromCoordinates, getCoordinatesFromLocation } = require("../services/locationTagService");

exports.tagLocation = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { latitude, longitude, address } = req.body;
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }
        if (latitude && longitude) {
            report.location.coordinates = [longitude, latitude];
            report.location.address = await getLocationFromCoordinates(latitude, longitude);
        } else if (address) {
            const coordinates = await getCoordinatesFromLocation(address);
            report.location.coordinates = coordinates;
            report.location.address = address;
        } else {
            return res.status(400).json({ message: "Either latitude/longitude or address must be provided" });
        }
        await report.save();
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }       
};  

exports.getLocation = async (req, res) => {
    try {
        const { reportId } = req.params;
        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }   
        res.json(report.location);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};  


