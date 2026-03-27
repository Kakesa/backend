const { Assignment, Submission } = require("./assignment.model");
const Student = require("../students/student.model");
const gradeService = require("../grades/grade.service");
const Course = require("../courses/course.model");

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
const _transcribeToGradebook = async (assignmentId, studentId, grade) => {
  try {
    const assignment = await Assignment.findById(assignmentId);
    const course = await Course.findById(assignment.courseId);

    if (assignment && course) {
      const trimester = assignment.trimester || 1;
      const academicYear = assignment.academicYear || "2026-2027";
      const subjectId = course.subjectId;

      // Determine which field to update in the Grade model
      let field = "devoir"; // default
      if (assignment.type === "tp" || assignment.type === "projet") {
        field = "interrogation1";
      } else if (assignment.type === "exposé") {
        field = "interrogation2";
      }

      await gradeService.updateOrCreateGrade({
        studentId,
        subjectId,
        trimester,
        academicYear,
        [field]: grade,
        maxScore: assignment.maxPoints || 20
      });
    }
  } catch (error) {
    console.error("Error transcribing grade to gradebook:", error);
  }
};

const submitAssignment = async (data) => {
  const { assignmentId, studentId, answers } = data;

  // Check if assignment exists
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw { statusCode: 404, message: "Devoir introuvable" };

  // Calculate status (late vs submitted)
  const now = new Date();
  let status = now > assignment.dueDate ? "late" : "submitted";
  let grade = null;

  // AUTO-GRADING LOGIC
  // If assignment has questions, calculate score
  if (assignment.questions && assignment.questions.length > 0) {
    let autoScore = 0;
    const studentAnswers = answers || [];
    const isFullyAutoCorrectable = assignment.questions.every(q =>
      q.type === 'qcm' || (q.type === 'short_answer' && q.correctAnswer)
    );

    if (isFullyAutoCorrectable) {
      assignment.questions.forEach(q => {
        const studentAns = studentAnswers.find(a => a.questionId === q.id)?.value;
        if (!studentAns) return;

        if (q.type === 'qcm') {
          const correctOpt = q.options.find(o => o.isCorrect);
          if (correctOpt && studentAns === correctOpt.id) {
            autoScore += (q.points || 0);
          }
        } else if (q.type === 'short_answer' && q.correctAnswer) {
          if (studentAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
            autoScore += (q.points || 0);
          }
        }
      });

      grade = autoScore;
      status = "graded"; // Mark as graded immediately
    }
  }

  const submission = await Submission.findOneAndUpdate(
    { assignmentId, studentId },
    {
      $set: { ...data, status, submittedAt: now, grade }
    },
    { upsert: true, new: true, runValidators: true }
  );

  // If auto-graded, transcribe to gradebook
  if (status === "graded" && grade !== null) {
    await _transcribeToGradebook(assignmentId, studentId, grade);
  }

  return submission;
};

const getSubmission = async (assignmentId, studentId) => {
  return await Submission.findOne({ assignmentId, studentId }).lean();
};

const getPendingSubmissions = async (teacherId) => {
  const assignments = await Assignment.find({ teacherId }).distinct("_id");

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

  const submission = await Submission.findOneAndUpdate(
    { assignmentId, studentId },
    { $set: { grade, feedback, status: "graded" } },
    { new: true }
  );

  if (!submission) throw { statusCode: 404, message: "Remise introuvable" };

  // --- TRANSCRIPTION TO GRADEBOOK ---
  await _transcribeToGradebook(assignmentId, studentId, grade);

  return submission;
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
