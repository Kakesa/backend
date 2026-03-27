const { Competence, Evaluation } = require("./evaluation.model");

/* =====================================================
   COMPETENCE SERVICE
===================================================== */
const createCompetence = async (data) => {
  const competence = new Competence(data);
  return await competence.save();
};

const getCompetences = async (query = {}) => {
  const { subjectId, schoolId } = query;
  const filter = {};
  if (subjectId) filter.subjectId = subjectId;
  if (schoolId) filter.schoolId = schoolId;

  return await Competence.find(filter)
    .populate("subjectId", "name code")
    .sort({ name: 1 })
    .lean();
};

const getCompetenceById = async (id) => {
  return await Competence.findById(id).populate("subjectId", "name code").lean();
};

const updateCompetence = async (id, data) => {
  return await Competence.findByIdAndUpdate(id, data, { new: true });
};

const deleteCompetence = async (id) => {
  return await Competence.findByIdAndDelete(id);
};

/* =====================================================
   EVALUATION SERVICE
===================================================== */
const evaluateStudent = async (data) => {
  const evaluation = new Evaluation(data);
  return await evaluation.save();
};

const getStudentEvaluations = async (studentId) => {
  return await Evaluation.find({ studentId })
    .populate("competenceId", "name subjectId")
    .populate("teacherId", "firstName lastName")
    .sort({ date: -1 })
    .lean();
};

const getProgress = async (studentId, competenceId) => {
  return await Evaluation.find({ studentId, competenceId })
    .sort({ date: 1 })
    .lean();
};

const updateEvaluation = async (id, data) => {
  return await Evaluation.findByIdAndUpdate(id, data, { new: true });
};

const deleteEvaluation = async (id) => {
  return await Evaluation.findByIdAndDelete(id);
};

module.exports = {
  createCompetence,
  getCompetences,
  getCompetenceById,
  updateCompetence,
  deleteCompetence,
  evaluateStudent,
  getStudentEvaluations,
  getProgress,
  updateEvaluation,
  deleteEvaluation,
};
