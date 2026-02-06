const courseService = require("./course.service");

/* =====================================================
   GET ALL COURSES
===================================================== */
const getAllCourses = async (req, res, next) => {
  try {
    const data = await courseService.getAllCourses(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET COURSE BY ID
===================================================== */
const getCourseById = async (req, res, next) => {
  try {
    const data = await courseService.getCourseById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   CREATE COURSE
===================================================== */
const createCourse = async (req, res, next) => {
  try {
    const data = await courseService.createCourse(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   UPDATE COURSE
===================================================== */
const updateCourse = async (req, res, next) => {
  try {
    const data = await courseService.updateCourse(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   DELETE COURSE
===================================================== */
const deleteCourse = async (req, res, next) => {
  try {
    await courseService.deleteCourse(req.params.id);
    res.status(200).json({ success: true, message: "Cours supprimé avec succès" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};
