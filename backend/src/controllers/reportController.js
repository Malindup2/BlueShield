// this is the controller for handling report-related operations such as creating, listing, updating, and deleting reports.

const Report = require("../models/Report");
exports.create = async (req, res) => {
    try { 
        const report = new Report({
            ...req.body,
            reportedBy: req.user._id  
        });
        await report.save();
        res.send("Report created successfully");
        res.status(201).json(report);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.list = async (req, res) => {
    try {
        const reports = await Report.find().populate("reportedBy", "name email");
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.reportId).populate("reportedBy", "name email");
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const report = await Report.findByIdAndUpdate(req.params.reportId, req.body, { new: true });    
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }
        res.json(report);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }   
};

exports.remove = async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.reportId);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }
        res.json({ message: "Report deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

