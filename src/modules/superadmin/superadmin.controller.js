const superAdminService = require('./superadmin.service');

const getAllSchoolsWithStats = async (req, res, next) => {
  try {
    const data = await superAdminService.getAllSchoolsWithStats();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getSchoolWithStatsById = async (req, res, next) => {
  try {
    const data = await superAdminService.getSchoolWithStatsById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getGlobalStats = async (req, res, next) => {
  try {
    const data = await superAdminService.getGlobalStats();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getAllActivities = async (req, res, next) => {
  try {
    const data = await superAdminService.getAllActivities();
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const toggleSchoolStatus = async (req, res, next) => {
  try {
    const data = await superAdminService.toggleSchoolStatus(req.params.id);
    res.status(200).json({ success: true, data });
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
