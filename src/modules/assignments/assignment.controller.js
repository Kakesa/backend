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

const getAssignmentById = async (req, res, next) => {
  try {
    const data = await assignmentService.getAssignmentById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Devoir introuvable" });
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

const updateAssignment = async (req, res, next) => {
  try {
    const data = await assignmentService.updateAssignment(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deleteAssignment = async (req, res, next) => {
  try {
    await assignmentService.deleteAssignment(req.params.id);
    res.status(200).json({ success: true, message: "Devoir supprimé avec succès" });
  } catch (err) {
    next(err);
  }
};

const uploadAssignmentFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Aucun fichier fourni" });
    }
    // Return the file path (relative to public/uploads or whatever the middleware does)
    // Assuming middleware puts file in req.file.path or filename
    // We'll return the relative URL
    const fileUrl = `/uploads/assignments/${req.file.filename}`;
    res.status(200).json({ success: true, data: { url: fileUrl } });
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
  getAssignmentById,
  getAssignmentByStudent,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  uploadAssignmentFile,
  submitAssignment,
  getSubmission,
  getPendingSubmissions,
  gradeSubmission,
};
