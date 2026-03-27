const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
      trim: true,
    },
    mainTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    // courses: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Course' } ],
    // schedules: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' } ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique index: name + academicYear + schoolId
classSchema.index({ name: 1, academicYear: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);
