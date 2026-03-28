const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique index: a subject, teacher, and class combination should be unique for a school (implied by refs)
courseSchema.index({ subjectId: 1, teacherId: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model("Course", courseSchema);
