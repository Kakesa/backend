const scheduleService = require("./schedule.service");

const getSchedules = async (req, res, next) => {
  try {
    const data = await scheduleService.getSchedules(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getSchedulesByClass = async (req, res, next) => {
  try {
    const data = await scheduleService.getSchedules({ classId: req.params.classId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getSchedulesByTeacher = async (req, res, next) => {
  try {
    const data = await scheduleService.getSchedules({ teacherId: req.params.teacherId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getSchedulesByRoom = async (req, res, next) => {
  try {
    const data = await scheduleService.getSchedules({ roomId: req.params.room });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const checkConflicts = async (req, res, next) => {
  try {
    const data = await scheduleService.checkConflicts(req.body);
    res.status(200).json({ success: true, conflicts: data });
  } catch (err) {
    next(err);
  }
};

const createSchedule = async (req, res, next) => {
  try {
    const data = await scheduleService.createSchedule(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const data = await scheduleService.updateSchedule(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    await scheduleService.deleteSchedule(req.params.id);
    res.status(200).json({ success: true, message: "Créneau supprimé avec succès" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSchedules,
  getSchedulesByClass,
  getSchedulesByTeacher,
  getSchedulesByRoom,
  checkConflicts,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
