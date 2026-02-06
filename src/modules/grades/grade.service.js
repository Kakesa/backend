const Grade = require("./grade.model");
const Student = require("../students/student.model");

/* =====================================================
   CREATE/UPDATE GRADE
===================================================== */
const updateOrCreateGrade = async (data) => {
  const { studentId, subjectId, trimester, academicYear } = data;
  
  // Calculate average if possible
  const { interrogation1, interrogation2, devoir, examen } = data;
  let total = 0;
  let count = 0;
  if (interrogation1) { total += interrogation1; count++; }
  if (interrogation2) { total += interrogation2; count++; }
  if (devoir) { total += devoir; count++; }
  if (examen) { total += examen; count++; }
  
  if (count > 0) {
    data.moyenne = total / count;
  }

  return await Grade.findOneAndUpdate(
    { studentId, subjectId, trimester, academicYear },
    { $set: data },
    { upsert: true, new: true, runValidators: true }
  );
};

/* =====================================================
   BULK CREATE GRADES
===================================================== */
const bulkCreateGrades = async (gradesArray) => {
  const operations = gradesArray.map(g => ({
    updateOne: {
      filter: { 
        studentId: g.studentId, 
        subjectId: g.subjectId, 
        trimester: g.trimester, 
        academicYear: g.academicYear 
      },
      update: { $set: g },
      upsert: true
    }
  }));
  return await Grade.bulkWrite(operations);
};

/* =====================================================
   GET GRADES
===================================================== */
const getGrades = async (query = {}) => {
  const { studentId, classId, subjectId, trimester, academicYear } = query;
  const filter = {};

  if (studentId) filter.studentId = studentId;
  if (subjectId) filter.subjectId = subjectId;
  if (trimester) filter.trimester = trimester;
  if (academicYear) filter.academicYear = academicYear;

  // Filter by classId if provided (need to find students in that class)
  if (classId) {
    const studentsInClass = await Student.find({ class: classId }).distinct("_id");
    filter.studentId = { $in: studentsInClass };
  }

  return await Grade.find(filter)
    .populate("studentId", "firstName lastName matricule")
    .populate("subjectId", "name code coefficient")
    .sort({ createdAt: -1 })
    .lean();
};

/* =====================================================
   DELETE GRADE
===================================================== */
const deleteGrade = async (id) => {
  const result = await Grade.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw { statusCode: 404, message: "Note introuvable" };
  return true;
};

module.exports = {
  updateOrCreateGrade,
  bulkCreateGrades,
  getGrades,
  deleteGrade,
};
