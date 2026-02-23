//this is the model for the case reviewd table in the database

const mongoose = require("mongoose");       

const caseReviewdSchema = new mongoose.Schema(
  {
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "IllegalCase",
        required: true,
        unique: true,   
    },
    reviewdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    reviewdAt: {
        type: Date,
        default: Date.now,
    },
    comments: {
        type: String,   
        default: null,
    },
  },
  { _id: true }
);

module.exports = mongoose.model("CaseReviewd", caseReviewdSchema);

