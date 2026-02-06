const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    trimester: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
    },
    interrogation1: { type: Number, default: null },
    interrogation2: { type: Number, default: null },
    devoir: { type: Number, default: null },
    examen: { type: Number, default: null },
    moyenne: { type: Number, default: null },
    appreciation: { type: String, trim: true },
    academicYear: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique index: student + subject + trimester + academicYear
gradeSchema.index(
  { studentId: 1, subjectId: 1, trimester: 1, academicYear: 1 },
  { unique: true }
);

module.exports = mongoose.model("Grade", gradeSchema);
