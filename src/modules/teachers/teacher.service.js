const Teacher = require("./teacher.model");

/* =====================================================
   CREATE TEACHER
===================================================== */
const createTeacher = async (data) => {
  // 🧹 Nettoyage des données
  if (data.subjects && Array.isArray(data.subjects)) {
    data.subjects = data.subjects.filter(id => id && id.trim() !== "");
  }
  if (data.classes && Array.isArray(data.classes)) {
    data.classes = data.classes.filter(id => id && id.trim() !== "");
  }
  if (data.status) {
    data.status = data.status.toLowerCase();
  }

  const teacher = new Teacher(data);
  return await teacher.save();
};

/* =====================================================
   GET ALL TEACHERS
===================================================== */
const getAllTeachers = async (query = {}) => {
  const { schoolId, subjectId } = query;
  const filter = {};
  if (schoolId) filter.schoolId = schoolId;
  if (subjectId) filter.subjects = subjectId;

  return await Teacher.find(filter)
    .populate("subjects", "name code")
    .populate("classes", "name level")
    .sort({ lastName: 1, firstName: 1 })
    .lean();
};

/* =====================================================
   GET TEACHER BY ID
===================================================== */
const getTeacherById = async (id) => {
  const teacher = await Teacher.findById(id)
    .populate("subjects", "name code")
    .populate("classes", "name level")
    .lean();
  if (!teacher) throw { statusCode: 404, message: "Professeur introuvable" };
  return teacher;
};

/* =====================================================
   UPDATE TEACHER
===================================================== */
const updateTeacher = async (id, data) => {
  // 🧹 Nettoyage des données
  if (data.subjects && Array.isArray(data.subjects)) {
    data.subjects = data.subjects.filter(id => id && id.trim() !== "");
  }
  if (data.classes && Array.isArray(data.classes)) {
    data.classes = data.classes.filter(id => id && id.trim() !== "");
  }
  if (data.status) {
    data.status = data.status.toLowerCase();
  }

  const teacher = await Teacher.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!teacher) throw { statusCode: 404, message: "Professeur introuvable" };
  return teacher;
};

/* =====================================================
   DELETE TEACHER
===================================================== */
const deleteTeacher = async (id) => {
  const result = await Teacher.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw { statusCode: 404, message: "Professeur introuvable" };
  return true;
};

module.exports = {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
};
