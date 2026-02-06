const { Assignment, Submission } = require("./assignment.model");
const Student = require("../students/student.model");

/* =====================================================
   ASSIGNMENT SERVICE
===================================================== */
const createAssignment = async (data) => {
  const assignment = new Assignment(data);
  return await assignment.save();
};

const getAssignments = async (query = {}) => {
  const { teacherId, classId, subjectId, studentId } = query;
  const filter = {};

  if (teacherId) filter.teacherId = teacherId;
  if (classId) filter.classId = classId;
  
  if (studentId) {
    const student = await Student.findById(studentId).lean();
    if (student) filter.classId = student.class;
  }

  return await Assignment.find(filter)
    .populate("teacherId", "firstName lastName")
    .populate("classId", "name")
    .populate("courseId")
    .sort({ dueDate: 1 })
    .lean();
};

/* =====================================================
   SUBMISSION SERVICE
===================================================== */
const submitAssignment = async (data) => {
  const { assignmentId, studentId } = data;
  return await Submission.findOneAndUpdate(
    { assignmentId, studentId },
    { $set: data },
    { upsert: true, new: true }
  );
};

const getSubmission = async (assignmentId, studentId) => {
  return await Submission.findOne({ assignmentId, studentId }).lean();
};

const getPendingSubmissions = async (teacherId) => {
  const assignments = await Assignment.find({ teacherId }).distinct("_id");
  return await Submission.find({ assignmentId: { $in: assignments }, status: "submitted" })
    .populate("studentId", "firstName lastName matricule")
    .populate("assignmentId", "title")
    .sort({ createdAt: 1 })
    .lean();
};

const gradeSubmission = async (assignmentId, studentId, gradeData) => {
  const { grade, feedback } = gradeData;
  return await Submission.findOneAndUpdate(
    { assignmentId, studentId },
    { $set: { grade, feedback, status: "graded" } },
    { new: true }
  );
};

module.exports = {
  createAssignment,
  getAssignments,
  submitAssignment,
  getSubmission,
  getPendingSubmissions,
  gradeSubmission,
};
