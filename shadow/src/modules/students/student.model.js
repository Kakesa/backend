const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    matricule: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER", "M", "F", "male", "female", "other"],
      required: true,
    },
    address: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      default: "",
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "active", "inactive", "suspended"],
      default: "ACTIVE",
    },
    parentName: {
      type: String,
      trim: true,
    },
    parentPhone: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Unique index for matricule within a school
studentSchema.index({ matricule: 1, school: 1 }, { unique: true });

module.exports = mongoose.model("Student", studentSchema);
