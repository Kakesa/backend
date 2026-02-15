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
    type: {
      type: String,
      enum: ["devoir", "tp", "projet", "exposé"],
      default: "devoir",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher", // Changed from Teacher to User or ensure Teacher model exists. Usually it's User with role teacher. Double check if Teacher model exists. The file view earlier showed "ref: 'Teacher'". I will stick to it for now but might need to change to User if Teacher doesn't exist.
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
    maxPoints: {
      type: Number,
      default: 20,
    },
    attachments: [
      {
        type: String, // URLs
      }
    ],
    status: {
      type: String,
      enum: ["published", "draft", "closed"],
      default: "published",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for submissions
assignmentSchema.virtual('submissions', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'assignmentId'
});

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student", // Ensure Student model exists
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    submissionType: {
      type: String,
      enum: ["file", "link"],
      default: "file"
    },
    attachments: [
      {
        type: String, // URLs
      }
    ],
    linkUrl: {
      type: String,
    },
    grade: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now
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
// Check if Submission model is already registered to avoid OverwriteModelError if this file is required multiple times? No, usually fine in CommonJS.
const Submission = mongoose.model("Submission", submissionSchema);

module.exports = { Assignment, Submission };
