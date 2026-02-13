const studentService = require("./student.service");

/* =====================================================
   GET ALL STUDENTS / FILTERS
===================================================== */
const getAllStudents = async (req, res, next) => {
  try {
    const filters = { ...req.query };
    // If not superadmin/admin, restrict by school
    if (req.user.role !== "superadmin") {
      filters.schoolId = req.user.school || req.user.schoolId;
    }
    const data = await studentService.getAllStudents(filters);
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
   GET STUDENT COURSES
 ===================================================== */
const getStudentCourses = async (req, res, next) => {
  try {
    const data = await studentService.getStudentCourses(req.params.id);
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
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: "Requête de recherche manquante" });
    }
    const schoolId = req.user.school;
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
    const studentData = { ...req.body };
    
    // Auto-fill school from user session
    if (req.user.school || req.user.schoolId) {
      studentData.school = req.user.school || req.user.schoolId;
    }

    // Map classId to class (frontend uses classId)
    if (studentData.classId && !studentData.class) {
      studentData.class = studentData.classId;
    }

    // Generate matricule if not provided
    if (!studentData.matricule) {
      const year = new Date().getFullYear();
      const count = await studentService.getAllStudents({ schoolId: studentData.school });
      studentData.matricule = `STD-${year}-${String((count?.totalStudents || 0) + 1).padStart(3, "0")}`;
    }

    // Vérifier si créé par admin ou enseignant
    const createdByAdmin = req.user.role === "admin" || req.user.role === "superadmin" || req.user.role === "teacher";

    const data = await studentService.createStudent(studentData, createdByAdmin);
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
  getStudentCourses,
  searchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};
