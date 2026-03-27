const express = require("express");
const router = express.Router();
const attendanceController = require("./attendance.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

router.get("/", attendanceController.getAllAttendance);
router.get("/student/:studentId", attendanceController.getAttendanceByStudent);
router.get("/course/:courseId/date/:date", attendanceController.getAttendanceByCourseAndDate);
router.get("/stats/:studentId", attendanceController.getStats);

router.post("/", attendanceController.createAttendance);
router.post("/bulk", attendanceController.bulkCreateAttendance);
router.post("/scan", attendanceController.scanAttendance);
router.put("/:id", attendanceController.updateAttendance);
router.delete("/:id", attendanceController.deleteAttendance);

module.exports = router;
