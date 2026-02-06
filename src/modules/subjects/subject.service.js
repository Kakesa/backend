const Subject = require("./subject.model");

/* =====================================================
   CREATE SUBJECT
===================================================== */
const createSubject = async (data) => {
  const subject = new Subject(data);
  return await subject.save();
};

/* =====================================================
   GET ALL SUBJECTS
===================================================== */
const getAllSubjects = async (query = {}) => {
  const { schoolId } = query;
  const filter = {};
  if (schoolId) filter.schoolId = schoolId;

  return await Subject.find(filter)
    .sort({ name: 1 })
    .lean();
};

/* =====================================================
   GET SUBJECT BY ID
===================================================== */
const getSubjectById = async (id) => {
  const subject = await Subject.findById(id).lean();
  if (!subject) throw { statusCode: 404, message: "Matière introuvable" };
  return subject;
};

/* =====================================================
   UPDATE SUBJECT
===================================================== */
const updateSubject = async (id, data) => {
  const subject = await Subject.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!subject) throw { statusCode: 404, message: "Matière introuvable" };
  return subject;
};

/* =====================================================
   DELETE SUBJECT
===================================================== */
const deleteSubject = async (id) => {
  const result = await Subject.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw { statusCode: 404, message: "Matière introuvable" };
  return true;
};

module.exports = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
};
