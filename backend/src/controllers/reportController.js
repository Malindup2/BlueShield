// this is the controller for handling report-related operations such as creating, listing, updating, and deleting reports.

const Report = require("../models/Report");
exports.create = async (req, res) => {
    try { 
        const attachments = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                attachments.push({
                    url: file.path, // Cloudinary URL
                    type: file.mimetype,
                });
            });
        }

        const report = new Report({
            ...req.body,
            reportedBy: req.user._id,
            attachments
        });
        await report.save();
        res.status(201).json(report);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


exports.list = async (req, res) => {
    try {
        const { page = 1, limit = 10, reportType, severity, status } = req.query;
        const query = {};
        if (reportType) query.reportType = reportType;
        if (severity) query.severity = severity;
        if (status) query.status = status;

        const reports = await Report.find(query)
            .populate("reportedBy", "name email")
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });
        
        const total = await Report.countDocuments(query);
        
        res.json({
            reports,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
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

