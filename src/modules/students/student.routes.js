const express = require("express");
const router = express.Router();
const studentController = require("./student.controller");
const { protect } = require("../../middlewares/auth.middleware");

// All routes are protected
router.use(protect);

router.get("/", studentController.getAllStudents);
router.get("/search", studentController.searchStudents);
router.get("/:id", studentController.getStudentById);
router.get("/:id/courses", studentController.getStudentCourses);
router.get("/class/:classId", studentController.getStudentsByClass);

router.post("/", studentController.createStudent);
router.put("/:id", studentController.updateStudent);
router.delete("/:id", studentController.deleteStudent);

module.exports = router;
