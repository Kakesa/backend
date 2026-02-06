const absenceService = require("./absence.service");

/* =====================================================
   ABSENCE CONTROLLER
===================================================== */
const getAbsences = async (req, res, next) => {
  try {
    const data = await absenceService.getAbsences(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getAbsenceByStudent = async (req, res, next) => {
  try {
    const data = await absenceService.getAbsences({ studentId: req.params.studentId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createAbsence = async (req, res, next) => {
  try {
    const data = await absenceService.createAbsence(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateAbsence = async (req, res, next) => {
  try {
    const data = await absenceService.updateAbsence(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   JUSTIFICATION CONTROLLER
===================================================== */
const getJustifications = async (req, res, next) => {
  try {
    const data = await absenceService.getJustifications(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getJustificationByStudent = async (req, res, next) => {
  try {
    const data = await absenceService.getJustifications({ studentId: req.params.studentId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getPendingJustifications = async (req, res, next) => {
  try {
    const data = await absenceService.getJustifications({ status: "pending" });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createJustification = async (req, res, next) => {
  try {
    const data = await absenceService.createJustification(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const reviewJustification = async (req, res, next) => {
  try {
    const data = await absenceService.reviewJustification(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAbsences,
  getAbsenceByStudent,
  createAbsence,
  updateAbsence,
  getJustifications,
  getJustificationByStudent,
  getPendingJustifications,
  createJustification,
  reviewJustification,
};
