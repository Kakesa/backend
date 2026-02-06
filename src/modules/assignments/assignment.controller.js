const assignmentService = require("./assignment.service");

/* =====================================================
   ASSIGNMENT CONTROLLER
===================================================== */
const getAssignments = async (req, res, next) => {
  try {
    const data = await assignmentService.getAssignments(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getAssignmentByStudent = async (req, res, next) => {
  try {
    const data = await assignmentService.getAssignments({ studentId: req.params.studentId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createAssignment = async (req, res, next) => {
  try {
    const data = await assignmentService.createAssignment(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   SUBMISSION CONTROLLER
===================================================== */
const submitAssignment = async (req, res, next) => {
  try {
    const data = await assignmentService.submitAssignment({
      ...req.body,
      assignmentId: req.params.id
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getSubmission = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;
    const data = await assignmentService.getSubmission(id, studentId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getPendingSubmissions = async (req, res, next) => {
  try {
    const data = await assignmentService.getPendingSubmissions(req.params.teacherId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const gradeSubmission = async (req, res, next) => {
  try {
    const { id, studentId } = req.params;
    const data = await assignmentService.gradeSubmission(id, studentId, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAssignments,
  getAssignmentByStudent,
  createAssignment,
  submitAssignment,
  getSubmission,
  getPendingSubmissions,
  gradeSubmission,
};
