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

const getJournal = async (req, res, next) => {
  try {
    const schoolId = req.user.school || req.user.schoolId;
    const { startDate, endDate, type } = req.query;

    const entries = await financeService.getJournalEntries(schoolId, {
      startDate,
      endDate,
      type,
    });

    res.status(200).json({
      success: true,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getJournal,
};
