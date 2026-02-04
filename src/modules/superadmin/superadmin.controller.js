// superadmin.controller.js
const superAdminService = require('./superadmin.service');
const School = require('../schools/school.model');

/* =====================================================
   GET /superadmin/schools
===================================================== */
const getAllSchoolsWithStats = async (req, res, next) => {
  try {
    const data = await superAdminService.getAllSchoolsWithStats();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET /superadmin/schools/:id
===================================================== */
const getSchoolWithStatsById = async (req, res, next) => {
  try {
    const data = await superAdminService.getSchoolWithStatsById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET /superadmin/stats
===================================================== */
const getGlobalStats = async (req, res, next) => {
  try {
    const data = await superAdminService.getGlobalStats();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET /superadmin/activities
===================================================== */
const getAllActivities = async (req, res, next) => {
  try {
    const data = await superAdminService.getAllActivities();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   PUT /superadmin/schools/:id/toggle-status
===================================================== */
const toggleSchoolStatus = async (req, res, next) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({ success: false, message: "École non trouvée" });
    }

    // Bascule entre active et suspended
    school.status = school.status === "active" ? "suspended" : "active";

    // Sauvegarde avec validation
    await school.save();

    // Réponse claire pour le front
    res.status(200).json({ 
      success: true, 
      data: {
        id: school._id,
        name: school.name,
        status: school.status, // le nouveau statut
      } 
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllSchoolsWithStats,
  getSchoolWithStatsById,
  getGlobalStats,
  getAllActivities,
  toggleSchoolStatus,
};
