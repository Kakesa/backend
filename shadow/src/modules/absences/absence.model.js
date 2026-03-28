const mongoose = require("mongoose");

const absenceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["unjustified", "justified", "pending"],
      default: "unjustified",
    },
    justificationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Justification",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Absence", absenceSchema);
