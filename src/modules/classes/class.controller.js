const classService = require("./class.service");

/* =====================================================
   GET ALL CLASSES
===================================================== */
const getAllClasses = async (req, res, next) => {
  try {
    const data = await classService.getAllClasses(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET CLASS BY ID
===================================================== */
const getClassById = async (req, res, next) => {
  try {
    const data = await classService.getClassById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   CREATE CLASS
===================================================== */
const createClass = async (req, res, next) => {
  try {
    const data = await classService.createClass(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   UPDATE CLASS
===================================================== */
const updateClass = async (req, res, next) => {
  try {
    const data = await classService.updateClass(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   DELETE CLASS
===================================================== */
const deleteClass = async (req, res, next) => {
  try {
    await classService.deleteClass(req.params.id);
    res.status(200).json({ success: true, message: "Classe supprimée avec succès" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
};
