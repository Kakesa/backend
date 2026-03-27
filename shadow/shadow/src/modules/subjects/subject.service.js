const Subject = require("./subject.model");

/* =====================================================
   CREATE SUBJECT
===================================================== */
const createSubject = async (data) => {
  try {
    const subject = new Subject(data);
    return await subject.save();
  } catch (error) {
    // Gérer les erreurs de doublon
    if (error.code === 11000 && error.keyPattern && error.keyPattern.code) {
      const duplicateCode = error.keyValue.code;
      const schoolId = error.keyValue.schoolId;
      
      // Générer un code alternatif
      const baseCode = duplicateCode.replace(/-\d+$/, ''); // Enlever le suffixe numérique
      let suggestedCode = `${baseCode}-1`;
      let counter = 2;
      
      // Chercher un code disponible
      while (await Subject.findOne({ code: suggestedCode, schoolId })) {
        suggestedCode = `${baseCode}-${counter}`;
        counter++;
      }
      
      throw {
        statusCode: 409,
        message: `Le code "${duplicateCode}" existe déjà dans votre école.`,
        suggestion: {
          message: "Code suggéré :",
          code: suggestedCode
        },
        type: "DUPLICATE_CODE"
      };
    }
    throw error;
  }
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
