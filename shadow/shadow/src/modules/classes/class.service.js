const Class = require("./class.model");

/* =====================================================
   CREATE CLASS
===================================================== */
const createClass = async (data) => {
  const newClass = new Class(data);
  return await newClass.save();
};

/* =====================================================
   GET ALL CLASSES
===================================================== */
const getAllClasses = async (query = {}) => {
  const { schoolId, academicYear } = query;
  
  const filter = {};
  if (schoolId) filter.schoolId = schoolId;
  if (academicYear) filter.academicYear = academicYear;

  return await Class.find(filter)
    .populate("mainTeacherId", "name email")
    .populate("schoolId", "name")
    .sort({ name: 1 })
    .lean();
};

/* =====================================================
   GET CLASS BY ID
===================================================== */
const getClassById = async (id) => {
  const classData = await Class.findById(id)
    .populate("mainTeacherId", "name email")
    .populate("schoolId", "name")
    .populate("students", "firstName lastName matricule")
    .lean();
  
  if (!classData) throw { statusCode: 404, message: "Classe introuvable" };
  return classData;
};

/* =====================================================
   GET CLASSES BY LEVEL
===================================================== */
const getClassesByLevel = async (level, schoolId) => {
  const filter = { level };
  if (schoolId) filter.schoolId = schoolId;

  return await Class.find(filter)
    .populate("mainTeacherId", "name email")
    .sort({ name: 1 })
    .lean();
};

/* =====================================================
   UPDATE CLASS
===================================================== */
const updateClass = async (id, data) => {
  const classData = await Class.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  
  if (!classData) throw { statusCode: 404, message: "Classe introuvable" };
  return classData;
};

/* =====================================================
   DELETE CLASS
===================================================== */
const deleteClass = async (id) => {
  const result = await Class.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw { statusCode: 404, message: "Classe introuvable" };
  return true;
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  getClassesByLevel,
  updateClass,
  deleteClass,
};
