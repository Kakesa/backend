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

const Competence = mongoose.model("Competence", competenceSchema);
const Evaluation = mongoose.model("Evaluation", evaluationSchema);

module.exports = { Competence, Evaluation };
