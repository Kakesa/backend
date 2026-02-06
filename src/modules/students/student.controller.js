const studentService = require("./student.service");

/* =====================================================
   GET ALL STUDENTS / FILTERS
===================================================== */
const getAllStudents = async (req, res, next) => {
  try {
    const data = await studentService.getAllStudents(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET STUDENT BY ID
===================================================== */
const getStudentById = async (req, res, next) => {
  try {
    const data = await studentService.getStudentById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET STUDENTS BY CLASS
===================================================== */
const getStudentsByClass = async (req, res, next) => {
  try {
    const data = await studentService.getStudentsByClass(req.params.classId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   SEARCH STUDENTS
===================================================== */
const searchStudents = async (req, res, next) => {
  try {
    const { q, schoolId } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: "Requête de recherche manquante" });
    }
    const data = await studentService.searchStudents(q, schoolId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   CREATE STUDENT
===================================================== */
const createStudent = async (req, res, next) => {
  try {
    const data = await studentService.createStudent(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   UPDATE STUDENT
===================================================== */
const updateStudent = async (req, res, next) => {
  try {
    const data = await studentService.updateStudent(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   DELETE STUDENT
===================================================== */
const deleteStudent = async (req, res, next) => {
  try {
    await studentService.deleteStudent(req.params.id);
    res.status(200).json({ success: true, message: "Élève supprimé avec succès" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  getStudentsByClass,
  searchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};
