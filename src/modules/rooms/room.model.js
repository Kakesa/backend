const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      default: 30,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    type: {
      type: String,
      enum: ["classroom", "lab", "gym", "office"],
      default: "classroom",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

roomSchema.index({ name: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model("Room", roomSchema);
