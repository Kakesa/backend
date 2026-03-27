const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    coefficient: {
      type: Number,
      required: true,
      default: 1,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique index: code + schoolId
subjectSchema.index({ code: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
