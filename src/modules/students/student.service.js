const Student = require("./student.model");

/* =====================================================
   CREATE STUDENT
===================================================== */
const createStudent = async (data) => {
  const student = new Student(data);
  return await student.save();
};

/* =====================================================
   GET ALL STUDENTS
===================================================== */
const getAllStudents = async (query = {}, options = {}) => {
  const { page = 1, limit = 10, schoolId, classId } = query;
  
  const filter = {};
  if (schoolId) filter.school = schoolId;
  if (classId) filter.class = classId;

  const students = await Student.find(filter)
    .populate("class", "name")
    .populate("school", "name")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 })
    .lean();

  const total = await Student.countDocuments(filter);

  return {
    students,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    totalStudents: total,
  };
};

/* =====================================================
   GET STUDENT BY ID
===================================================== */
const getStudentById = async (id) => {
  const student = await Student.findById(id)
    .populate("class", "name")
    .populate("school", "name")
    .lean();
  
  if (!student) throw { statusCode: 404, message: "Élève introuvable" };
  return student;
};

/* =====================================================
   GET STUDENTS BY CLASS
===================================================== */
const getStudentsByClass = async (classId) => {
  return await Student.find({ class: classId })
    .populate("class", "name")
    .lean();
};

/* =====================================================
   SEARCH STUDENTS
===================================================== */
const searchStudents = async (searchTerm, schoolId) => {
  const filter = {
    school: schoolId,
    $or: [
      { firstName: { $regex: searchTerm, $options: "i" } },
      { lastName: { $regex: searchTerm, $options: "i" } },
      { matricule: { $regex: searchTerm, $options: "i" } },
    ],
  };

  return await Student.find(filter)
    .populate("class", "name")
    .lean();
};

/* =====================================================
   UPDATE STUDENT
===================================================== */
const updateStudent = async (id, data) => {
  const student = await Student.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  
  if (!student) throw { statusCode: 404, message: "Élève introuvable" };
  return student;
};

/* =====================================================
   DELETE STUDENT
===================================================== */
const deleteStudent = async (id) => {
  const result = await Student.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw { statusCode: 404, message: "Élève introuvable" };
  return true;
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  getStudentsByClass,
  searchStudents,
  updateStudent,
  deleteStudent,
};
