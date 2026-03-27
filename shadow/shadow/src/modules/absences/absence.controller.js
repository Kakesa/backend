const absenceService = require("./absence.service");
const Teacher = require("../teachers/teacher.model");
const Student = require("../students/student.model");
const Class = require("../classes/class.model");

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
   TEACHER SPECIFIC CONTROLLERS
===================================================== */
const getTeacherClassesAbsences = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const data = await absenceService.getTeacherClassesAbsences(teacherId, req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getClassAbsences = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user._id;
    const data = await absenceService.getClassAbsences(classId, teacherId, req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const markAbsence = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const data = await absenceService.markAbsence({ ...req.body, teacherId });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateTeacherAbsence = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const data = await absenceService.updateTeacherAbsence(req.params.id, req.body, teacherId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getPendingTeacherJustifications = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const data = await absenceService.getPendingTeacherJustifications(teacherId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const reviewTeacherJustification = async (req, res, next) => {
  try {
    const teacherId = req.user._id;
    const data = await absenceService.reviewTeacherJustification(req.params.id, { ...req.body, reviewedBy: teacherId });
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
    const data = await absenceService.getPendingJustifications();
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

const uploadJustificationFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Aucun fichier n'a été fourni" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    const data = await absenceService.updateJustificationFile(req.params.id, {
      documentUrl: fileUrl,
      fileName: req.file.originalname,
    });

    res.status(200).json({ success: true, data: { url: fileUrl } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAbsences,
  getAbsenceByStudent,
  createAbsence,
  updateAbsence,
  getTeacherClassesAbsences,
  getClassAbsences,
  markAbsence,
  updateTeacherAbsence,
  getPendingTeacherJustifications,
  reviewTeacherJustification,
  getJustifications,
  getJustificationByStudent,
  getPendingJustifications,
  createJustification,
  reviewJustification,
  uploadJustificationFile,
};
