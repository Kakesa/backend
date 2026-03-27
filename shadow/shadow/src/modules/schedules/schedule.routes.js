const express = require("express");
const router = express.Router();
const scheduleController = require("./schedule.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

router.get("/", scheduleController.getSchedules);
router.get("/me", scheduleController.getMySchedules);
router.get("/class/:classId", scheduleController.getSchedulesByClass);
router.get("/teacher/:teacherId", scheduleController.getSchedulesByTeacher);
router.get("/room/:room", scheduleController.getSchedulesByRoom);
router.post("/check-conflicts", scheduleController.checkConflicts);
router.post("/", scheduleController.createSchedule);
router.put("/:id", scheduleController.updateSchedule);
router.delete("/:id", scheduleController.deleteSchedule);

module.exports = router;
