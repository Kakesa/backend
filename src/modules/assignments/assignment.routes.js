const express = require("express");
const router = express.Router();
const assignmentController = require("./assignment.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

router.get("/", assignmentController.getAssignments);
router.get("/student/:studentId", assignmentController.getAssignmentByStudent);
router.get("/:id/submission/:studentId", assignmentController.getSubmission);
router.get("/pending/:teacherId", assignmentController.getPendingSubmissions);

router.post("/", assignmentController.createAssignment);
router.post("/:id/submit", assignmentController.submitAssignment);
router.post("/:id/grade/:studentId", assignmentController.gradeSubmission);

module.exports = router;
