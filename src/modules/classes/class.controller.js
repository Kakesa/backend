const classService = require("./class.service");

/* =====================================================
   GET ALL CLASSES
===================================================== */
const getAllClasses = async (req, res, next) => {
  try {
    // Le schoolId est ajouté automatiquement par le middleware schoolFilter
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
    
    // Vérification manuelle de l'appartenance à l'école
    if (req.user && req.user.role !== 'superadmin' && data) {
      const entitySchoolId = data.schoolId || data.school;
      if (entitySchoolId && entitySchoolId.toString() !== req.user.school.toString()) {
        return res.status(403).json({
          message: 'Accès non autorisé: cette ressource n\'appartient pas à votre établissement',
          error: 'Entity belongs to different school'
        });
      }
    }
    
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET CLASSES BY LEVEL
===================================================== */
const getClassesByLevel = async (req, res, next) => {
  try {
    const { level } = req.params;
    const { schoolId } = req.query;
    const data = await classService.getClassesByLevel(level, schoolId);
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
  getClassesByLevel,
  createClass,
  updateClass,
  deleteClass,
};
