const express = require("express");
const router = express.Router();
const courseController = require("./course.controller");
const { protect } = require("../../middlewares/auth.middleware");

// Protections
router.use(protect);

router.get("/", courseController.getAllCourses);
router.get("/:id", courseController.getCourseById);
router.post("/", courseController.createCourse);
router.put("/:id", courseController.updateCourse);
router.delete("/:id", courseController.deleteCourse);

module.exports = router;
