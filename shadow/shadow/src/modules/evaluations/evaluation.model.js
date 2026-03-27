const mongoose = require("mongoose");

const competenceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
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

const evaluationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    competenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Competence",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    level: {
      type: String,
      enum: ["Acquis", "En cours", "Non acquis", "A renforcer"],
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    observations: {
      type: String,
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

const Competence = mongoose.model("Competence", competenceSchema);
const Evaluation = mongoose.model("Evaluation", evaluationSchema);

module.exports = { Competence, Evaluation };
