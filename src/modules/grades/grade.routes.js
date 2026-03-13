const express = require("express");
const router = express.Router();
const gradeController = require("./grade.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

router.get("/", gradeController.getGrades);
router.get("/ranking", gradeController.getRanking);
router.get("/averages", gradeController.getSchoolAverages);
router.get("/student/:studentId", gradeController.getGradesByStudent);
router.get("/student/:studentId/average", gradeController.getStudentAverage);
router.get("/student/:studentId/trimester/:trimester", gradeController.getGradesByStudent);
router.get("/class/:classId/subject/:subjectId", gradeController.getGradesByClassAndSubject);
router.get("/class/:classId", gradeController.getGradesByClass);

router.post("/", gradeController.createGrade);
router.post("/bulk", gradeController.bulkCreateGrades);
router.put("/:id", gradeController.updateGrade);
router.delete("/:id", gradeController.deleteGrade);

module.exports = router;
