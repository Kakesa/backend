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
    // coefficient (barème) maximum pour cette fiche d'évaluation
    maxScore: { type: Number, required: true, default: 20 },
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

// Validate that each note does not exceed maxScore
gradeSchema.pre('validate', function(next) {
  const max = this.maxScore;
  ['interrogation1','interrogation2','devoir','examen'].forEach(field => {
    if (this[field] != null && max != null && this[field] > max) {
      this.invalidate(field, `La note (${this[field]}) ne peut pas dépasser le coefficient ${max}`);
    }
  });
  next();
});

module.exports = mongoose.model("Grade", gradeSchema);
