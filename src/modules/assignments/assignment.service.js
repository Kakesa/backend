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
  const { teacherId, classId, subjectId, studentId, type } = query;
  const filter = {};

  if (teacherId) filter.teacherId = teacherId;
  if (classId) filter.classId = classId;
  if (type) filter.type = type;
  
  if (studentId) {
    const student = await Student.findById(studentId).lean();
    if (student) filter.classId = student.class;
  }

  return await Assignment.find(filter)
    .populate("teacherId", "firstName lastName") // Assuming teacherId refs User/Teacher with these fields
    .populate("classId", "name")
    .populate("courseId")
    .populate({
      path: "submissions",
      select: "studentId status grade submittedAt"
    })
    .sort({ dueDate: 1 })
    .lean({ virtuals: true });
};

const getAssignmentById = async (id) => {
  return await Assignment.findById(id)
    .populate("teacherId", "firstName lastName")
    .populate("classId", "name")
    .populate("courseId")
    .lean({ virtuals: true });
};

const updateAssignment = async (id, data) => {
  const assignment = await Assignment.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  );
  if (!assignment) throw { statusCode: 404, message: "Devoir introuvable" };
  return assignment;
};

const deleteAssignment = async (id) => {
  const assignment = await Assignment.findById(id);
  if (!assignment) throw { statusCode: 404, message: "Devoir introuvable" };
  
  // Delete associated submissions
  await Submission.deleteMany({ assignmentId: id });
  await Assignment.deleteOne({ _id: id });
  return true;
};

/* =====================================================
   SUBMISSION SERVICE
===================================================== */
const submitAssignment = async (data) => {
  const { assignmentId, studentId } = data;
  
  // Check if assignment exists
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw { statusCode: 404, message: "Devoir introuvable" };

  // Calculate status (late vs submitted)
  const now = new Date();
  const status = now > assignment.dueDate ? "late" : "submitted";

  return await Submission.findOneAndUpdate(
    { assignmentId, studentId },
    { 
      $set: { ...data, status, submittedAt: now } 
    },
    { upsert: true, new: true, runValidators: true }
  );
};

const getSubmission = async (assignmentId, studentId) => {
  return await Submission.findOne({ assignmentId, studentId }).lean();
};

const getPendingSubmissions = async (teacherId) => {
  // Find all assignments for this teacher
  const assignments = await Assignment.find({ teacherId }).distinct("_id");
  
  // Find submissions for these assignments that are submitted or late (not yet graded)
  return await Submission.find({ 
    assignmentId: { $in: assignments }, 
    status: { $in: ["submitted", "late"] } 
  })
    .populate("studentId", "firstName lastName matricule photo")
    .populate("assignmentId", "title type dueDate maxPoints")
    .sort({ submittedAt: 1 })
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
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmission,
  getPendingSubmissions,
  gradeSubmission,
};
