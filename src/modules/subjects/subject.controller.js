const subjectService = require("./subject.service");

/* =====================================================
   GET ALL SUBJECTS
===================================================== */
const getAllSubjects = async (req, res, next) => {
  try {
    const data = await subjectService.getAllSubjects(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET SUBJECT BY ID
===================================================== */
const getSubjectById = async (req, res, next) => {
  try {
    const data = await subjectService.getSubjectById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   CREATE SUBJECT
===================================================== */
const createSubject = async (req, res, next) => {
  try {
    const data = await subjectService.createSubject(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   UPDATE SUBJECT
===================================================== */
const updateSubject = async (req, res, next) => {
  try {
    const data = await subjectService.updateSubject(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   DELETE SUBJECT
===================================================== */
const deleteSubject = async (req, res, next) => {
  try {
    await subjectService.deleteSubject(req.params.id);
    res.status(200).json({ success: true, message: "Matière supprimée avec succès" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
};
