const mongoose = require("mongoose");

const justificationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    documentType: {
      type: String,
      enum: ["medical", "family", "administrative", "other"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    documentUrl: {
      type: String,
      default: "",
    },
    fileName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Justification", justificationSchema);
