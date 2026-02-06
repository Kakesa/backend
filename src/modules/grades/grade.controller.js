const gradeService = require("./grade.service");

const getGrades = async (req, res, next) => {
  try {
    const data = await gradeService.getGrades(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getGradesByStudent = async (req, res, next) => {
  try {
    const { studentId, trimester } = req.params;
    const query = { studentId };
    if (trimester) query.trimester = trimester;
    const data = await gradeService.getGrades(query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getGradesByClassAndSubject = async (req, res, next) => {
  try {
    const { classId, subjectId } = req.params;
    const data = await gradeService.getGrades({ classId, subjectId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createGrade = async (req, res, next) => {
  try {
    const data = await gradeService.updateOrCreateGrade(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const bulkCreateGrades = async (req, res, next) => {
  try {
    const data = await gradeService.bulkCreateGrades(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateGrade = async (req, res, next) => {
  try {
    // Reusing the same service method for update as it handles upsert/set
    const data = await gradeService.updateOrCreateGrade({ ...req.body, _id: req.params.id });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deleteGrade = async (req, res, next) => {
  try {
    await gradeService.deleteGrade(req.params.id);
    res.status(200).json({ success: true, message: "Note supprimée avec succès" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGrades,
  getGradesByStudent,
  getGradesByClassAndSubject,
  createGrade,
  bulkCreateGrades,
  updateGrade,
  deleteGrade,
};
