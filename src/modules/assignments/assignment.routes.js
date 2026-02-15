const express = require("express");
const router = express.Router();
const assignmentController = require("./assignment.controller");
const { protect } = require("../../middlewares/auth.middleware");
const upload = require("./assignment.upload"); // Import our new upload config

router.use(protect);

// CRUD Assignments
router.get("/", assignmentController.getAssignments);
router.get("/student/:studentId", assignmentController.getAssignmentByStudent);
router.get("/:id", assignmentController.getAssignmentById); // New
router.post("/", assignmentController.createAssignment);
router.put("/:id", assignmentController.updateAssignment); // New
router.delete("/:id", assignmentController.deleteAssignment); // New

// File Upload
router.post("/:id/upload", upload.single('file'), assignmentController.uploadAssignmentFile); // New

// Submissions
router.get("/:id/submission/:studentId", assignmentController.getSubmission);
router.get("/pending/:teacherId", assignmentController.getPendingSubmissions);
router.post("/:id/submit", assignmentController.submitAssignment);
router.post("/:id/grade/:studentId", assignmentController.gradeSubmission);

module.exports = router;
