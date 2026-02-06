const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
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
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    fileUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["published", "draft", "closed"],
      default: "published",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    grade: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["submitted", "graded", "late"],
      default: "submitted",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

const Assignment = mongoose.model("Assignment", assignmentSchema);
const Submission = mongoose.model("Submission", submissionSchema);

module.exports = { Assignment, Submission };
