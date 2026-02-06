const teacherService = require("./teacher.service");

/* =====================================================
   GET ALL TEACHERS
===================================================== */
const getAllTeachers = async (req, res, next) => {
  try {
    const data = await teacherService.getAllTeachers(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET TEACHER BY ID
===================================================== */
const getTeacherById = async (req, res, next) => {
  try {
    const data = await teacherService.getTeacherById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   CREATE TEACHER
===================================================== */
const createTeacher = async (req, res, next) => {
  try {
    const data = await teacherService.createTeacher(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   UPDATE TEACHER
===================================================== */
const updateTeacher = async (req, res, next) => {
  try {
    const data = await teacherService.updateTeacher(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   DELETE TEACHER
===================================================== */
const deleteTeacher = async (req, res, next) => {
  try {
    await teacherService.deleteTeacher(req.params.id);
    res.status(200).json({ success: true, message: "Professeur supprimé avec succès" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
