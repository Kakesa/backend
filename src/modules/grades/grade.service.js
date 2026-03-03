const Grade = require("./grade.model");
const Student = require("../students/student.model");

/* =====================================================
   CREATE/UPDATE GRADE
===================================================== */
const updateOrCreateGrade = async (data) => {
  const { studentId, subjectId, trimester, academicYear } = data;

  // determine coefficient (maxScore) to use for validation; use provided value or default 20
  const maxScore = data.maxScore != null ? data.maxScore : 20;

  // validate notes don't exceed coefficient (maxScore)
  ['interrogation1', 'interrogation2', 'devoir', 'examen'].forEach(field => {
    if (data[field] != null && data[field] > maxScore) {
      throw new Error(`La note ${field} (${data[field]}) ne peut pas dépasser le coefficient ${maxScore}`);
    }
  });

  // Calculate average if possible (simple arithmetic mean of entered notes)
  const { interrogation1, interrogation2, devoir, examen } = data;
  let total = 0;
  let count = 0;
  if (interrogation1 != null) { total += interrogation1; count++; }
  if (interrogation2 != null) { total += interrogation2; count++; }
  if (devoir != null) { total += devoir; count++; }
  if (examen != null) { total += examen; count++; }

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
  // perform same maxScore validation before bulk write
  gradesArray.forEach(g => {
    const maxScore = g.maxScore != null ? g.maxScore : 20;
    ['interrogation1', 'interrogation2', 'devoir', 'examen'].forEach(field => {
      if (g[field] != null && g[field] > maxScore) {
        throw new Error(`La note ${field} (${g[field]}) ne peut pas dépasser le coefficient ${maxScore}`);
      }
    });
  });

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
  // Convert trimester to number if provided (query params come as strings)
  if (trimester && trimester !== "annual") {
    filter.trimester = parseInt(trimester, 10);
  }
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

/* =====================================================
   GET STUDENT AVERAGE
===================================================== */
const getStudentAverage = async (studentId, trimester, academicYear) => {
  const filter = { studentId };
  if (trimester && trimester !== "annual") filter.trimester = Number(trimester);
  if (academicYear) filter.academicYear = academicYear;

  const grades = await Grade.find(filter).populate("subjectId", "coefficient");

  if (grades.length === 0) return { moyenne: 0, totalCoef: 0, count: 0 };

  let weightedSum = 0;
  let totalCoef = 0;

  grades.forEach(g => {
    if (g.moyenne !== null && g.subjectId) {
      const coef = g.subjectId.coefficient || 1;
      weightedSum += g.moyenne * coef;
      totalCoef += coef;
    }
  });

  return {
    moyenne: totalCoef > 0 ? weightedSum / totalCoef : 0,
    totalCoef,
    count: grades.length
  };
};

/* =====================================================
   GET SCHOOL RANKING
===================================================== */
const getRanking = async (query = {}) => {
  const { trimester, academicYear, limit = 10, classId } = query;

  const studentFilter = {};
  if (classId) studentFilter.class = classId;

  const students = await Student.find(studentFilter).populate("class", "name").lean();

  const rankings = await Promise.all(students.map(async (student) => {
    const avgData = await getStudentAverage(student._id, trimester, academicYear);
    return {
      studentId: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      matricule: student.matricule,
      class: student.class?.name || "N/A",
      classId: student.class?._id || student.class,
      moyenne: Number(avgData.moyenne.toFixed(2)),
      totalCoef: avgData.totalCoef,
      count: avgData.count
    };
  }));

  // Sort by average descending
  rankings.sort((a, b) => b.moyenne - a.moyenne);

  // Add rank
  rankings.forEach((item, index) => {
    item.rank = index + 1;
  });

  return limit ? rankings.slice(0, Number(limit)) : rankings;
};

/* =====================================================
   GET SCHOOL AVERAGES (OVER TIME)
===================================================== */
const getSchoolAverages = async (academicYear = "2026-2027") => {
  const trimesters = [1, 2, 3];
  const history = await Promise.all(trimesters.map(async (t) => {
    const grades = await Grade.find({ trimester: t, academicYear }).populate("subjectId", "coefficient");
    if (grades.length === 0) return { trimester: t, average: 0 };

    let totalWeighted = 0;
    let totalCoef = 0;

    grades.forEach(g => {
      if (g.moyenne !== null && g.subjectId) {
        const coef = g.subjectId.coefficient || 1;
        totalWeighted += g.moyenne * coef;
        totalCoef += coef;
      }
    });

    return {
      trimester: t,
      average: totalCoef > 0 ? Number((totalWeighted / totalCoef).toFixed(2)) : 0
    };
  }));

  return history;
};

module.exports = {
  updateOrCreateGrade,
  bulkCreateGrades,
  getGrades,
  deleteGrade,
  getStudentAverage,
  getRanking,
  getSchoolAverages
};
