const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        // Determine resource type for Cloudinary
        let resourceType = "auto"; // auto detects image/video/raw

        return {
            folder: "blueshield/evidence",
            resource_type: resourceType,
            // Keep original filename 
            public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, "").replace(/\s+/g, "_")}`,
            allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "avi", "pdf", "doc", "docx"],
        };
    },
});

// File filter-reject unsupported types early
const fileFilter = (req, file, cb) => {
    const allowed = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "video/mp4", "video/quicktime", "video/x-msvideo",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB max per file
        files: 5,                    // max 5 files per request
    },
});

// Export the configured middleware for evidence routes
module.exports = {
    uploadEvidence: upload.array("files", 5),
};
