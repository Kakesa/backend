const Course = require("./course.model");

/* =====================================================
   CREATE COURSE
===================================================== */
const createCourse = async (data) => {
  const course = new Course(data);
  return await course.save();
};

/* =====================================================
   GET ALL COURSES
===================================================== */
const getAllCourses = async (query = {}) => {
  const { classId, teacherId, subjectId } = query;
  const filter = {};
  if (classId) filter.classId = classId;
  if (teacherId) filter.teacherId = teacherId;
  if (subjectId) filter.subjectId = subjectId;

  return await Course.find(filter)
    .populate("subjectId", "name code coefficient")
    .populate("teacherId", "firstName lastName email")
    .populate("classId", "name level")
    .lean();
};

/* =====================================================
   GET COURSE BY ID
===================================================== */
const getCourseById = async (id) => {
  const course = await Course.findById(id)
    .populate("subjectId", "name code")
    .populate("teacherId", "firstName lastName")
    .populate("classId", "name level")
    .lean();
  if (!course) throw { statusCode: 404, message: "Cours introuvable" };
  return course;
};

/* =====================================================
   UPDATE COURSE
===================================================== */
const updateCourse = async (id, data) => {
  const course = await Course.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!course) throw { statusCode: 404, message: "Cours introuvable" };
  return course;
};

/* =====================================================
   DELETE COURSE
===================================================== */
const deleteCourse = async (id) => {
  const result = await Course.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw { statusCode: 404, message: "Cours introuvable" };
  return true;
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
};
