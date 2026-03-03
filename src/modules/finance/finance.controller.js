const financeService = require("./finance.service");

const getDashboardStats = async (req, res, next) => {
  try {
    const schoolId = req.user.school || req.user.schoolId;
    const stats = await financeService.getFinanceDashboardStats(schoolId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
