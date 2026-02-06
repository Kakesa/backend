const evaluationService = require("./evaluation.service");

/* =====================================================
   COMPETENCE CONTROLLER
===================================================== */
const getCompetences = async (req, res, next) => {
  try {
    const data = await evaluationService.getCompetences(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getCompetenceById = async (req, res, next) => {
  try {
    const data = await evaluationService.getCompetenceById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createCompetence = async (req, res, next) => {
  try {
    const data = await evaluationService.createCompetence(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   EVALUATION CONTROLLER
===================================================== */
const getStudentEvaluations = async (req, res, next) => {
  try {
    const data = await evaluationService.getStudentEvaluations(req.params.studentId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getProgress = async (req, res, next) => {
  try {
    const { studentId, competenceId } = req.params;
    const data = await evaluationService.getProgress(studentId, competenceId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createEvaluation = async (req, res, next) => {
  try {
    const data = await evaluationService.evaluateStudent(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCompetences,
  getCompetenceById,
  createCompetence,
  getStudentEvaluations,
  getProgress,
  createEvaluation,
};
