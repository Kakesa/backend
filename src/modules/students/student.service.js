const Student = require("./student.model");
const Class = require("../classes/class.model");
const Course = require("../courses/course.model");

/* =====================================================
   CREATE STUDENT
 ===================================================== */
const createStudent = async (data) => {
  const student = new Student(data);
  const savedStudent = await student.save();

  // Synchronize with Class: Add student ID to the class's students array
  if (savedStudent.class) {
    await Class.findByIdAndUpdate(savedStudent.class, {
      $addToSet: { students: savedStudent._id },
    });
  }

  return savedStudent;
};

/* =====================================================
   GET ALL STUDENTS / FILTERS
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
   GET STUDENT COURSES
 ===================================================== */
const getStudentCourses = async (studentId) => {
  const student = await Student.findById(studentId).lean();
  if (!student) throw { statusCode: 404, message: "Élève introuvable" };

  // Courses are linked to the class
  const courses = await Course.find({ classId: student.class })
    .populate("subjectId")
    .populate("teacherId", "firstName lastName email")
    .lean();

  return courses;
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
  const oldStudent = await Student.findById(id);
  
  const student = await Student.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  
  if (!student) throw { statusCode: 404, message: "Élève introuvable" };

  // If class changed, update both classes
  if (data.class && oldStudent.class && oldStudent.class.toString() !== data.class.toString()) {
    // Remove from old class
    await Class.findByIdAndUpdate(oldStudent.class, {
      $pull: { students: id },
    });
    // Add to new class
    await Class.findByIdAndUpdate(data.class, {
      $addToSet: { students: id },
    });
  }

  return student;
};

/* =====================================================
   DELETE STUDENT
 ===================================================== */
const deleteStudent = async (id) => {
  const student = await Student.findById(id);
  if (!student) throw { statusCode: 404, message: "Élève introuvable" };

  // Remove from class
  if (student.class) {
    await Class.findByIdAndUpdate(student.class, {
      $pull: { students: id },
    });
  }

  const result = await Student.deleteOne({ _id: id });
  return true;
};

module.exports = {
  createStudent,
  getAllStudents,
  getStudentById,
  getStudentsByClass,
  getStudentCourses,
  searchStudents,
  updateStudent,
  deleteStudent,
};
