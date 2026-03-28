const Schedule = require("./schedule.model");
const Course = require("../courses/course.model");

/* =====================================================
   CHECK CONFLICTS
===================================================== */
const checkConflicts = async (data) => {
  const { dayOfWeek, startTime, endTime, roomId, classId, teacherId } = data;

  const query = {
    dayOfWeek,
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ],
    $or: []
  };

  const conflictFilters = [];
  if (roomId) conflictFilters.push({ roomId });
  if (classId) conflictFilters.push({ classId });
  
  // If teacherId is provided (need to join with Course)
  if (teacherId) {
    const teacherCourses = await Course.find({ teacherId }).distinct("_id");
    conflictFilters.push({ courseId: { $in: teacherCourses } });
  }

  if (conflictFilters.length === 0) return [];
  
  query.$or = conflictFilters;

  return await Schedule.find(query)
    .populate({
      path: "courseId",
      populate: { path: "teacherId", select: "firstName lastName" }
    })
    .populate("classId", "name")
    .populate("roomId", "name")
    .lean();
};

/* =====================================================
   CREATE SCHEDULE
===================================================== */
const createSchedule = async (data) => {
  const conflicts = await checkConflicts(data);
  if (conflicts.length > 0) {
    throw { 
      statusCode: 409, 
      message: "Conflit d'emploi du temps détécté", 
      conflicts 
    };
  }
  const schedule = new Schedule(data);
  return await schedule.save();
};

/* =====================================================
   GET SCHEDULES
===================================================== */
const getSchedules = async (query = {}) => {
  const { classId, teacherId, roomId } = query;
  const filter = {};
  
  if (classId) filter.classId = classId;
  if (roomId) filter.roomId = roomId;

  if (teacherId) {
    const teacherCourses = await Course.find({ teacherId }).distinct("_id");
    filter.courseId = { $in: teacherCourses };
  }

  return await Schedule.find(filter)
    .populate({
      path: "courseId",
      populate: [
        { path: "subjectId", select: "name code" },
        { path: "teacherId", select: "firstName lastName" }
      ]
    })
    .populate("classId", "name level")
    .populate("roomId", "name")
    .sort({ dayOfWeek: 1, startTime: 1 })
    .lean();
};

/* =====================================================
   UPDATE SCHEDULE
===================================================== */
const updateSchedule = async (id, data) => {
  // Logic for conflicts on update would be similar but excluding current ID
  const schedule = await Schedule.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!schedule) throw { statusCode: 404, message: "Créneau introuvable" };
  return schedule;
};

/* =====================================================
   DELETE SCHEDULE
===================================================== */
const deleteSchedule = async (id) => {
  const result = await Schedule.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw { statusCode: 404, message: "Créneau introuvable" };
  return true;
};

module.exports = {
  checkConflicts,
  createSchedule,
  getSchedules,
  updateSchedule,
  deleteSchedule,
};
