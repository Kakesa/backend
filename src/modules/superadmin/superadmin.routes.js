const express = require('express');
const router = express.Router();

const { protect } = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const {
  getAllSchoolsWithStats,
  getSchoolWithStatsById,
  getGlobalStats,
  getAllActivities,
  toggleSchoolStatus,
} = require('./superadmin.controller');

// 🔐 TOUT superadmin uniquement
router.use(protect);
router.use(restrictTo('superadmin'));

// GET /api/superadmin/schools
router.get('/schools', getAllSchoolsWithStats);

// GET /api/superadmin/schools/:id
router.get('/schools/:id', getSchoolWithStatsById);

// GET /api/superadmin/stats
router.get('/stats', getGlobalStats);

// GET /api/superadmin/activities
router.get('/activities', getAllActivities);

// PUT /api/superadmin/schools/:id/toggle-status
router.put('/schools/:id/toggle-status', toggleSchoolStatus);

module.exports = router;
