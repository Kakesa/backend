const express = require('express');
const router = express.Router();

const { protect } = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware');

const superAdminController = require('./superadmin.controller');

// 🔐 Middleware : accessible uniquement aux superadmins
router.use(protect);
router.use(restrictTo('superadmin'));

/* =====================================================
   SCHOOLS
===================================================== */
// GET all schools with stats
router.get('/schools', superAdminController.getAllSchoolsWithStats);

// GET a single school with stats
router.get('/schools/:id', superAdminController.getSchoolWithStatsById);

// PUT toggle school status (active/inactive)
router.put('/schools/:id/toggle-status', superAdminController.toggleSchoolStatus);

/* =====================================================
   GLOBAL STATS
===================================================== */
// GET overall platform stats
router.get('/stats', superAdminController.getGlobalStats);

/* =====================================================
   ACTIVITIES
===================================================== */
// GET recent activities (audit logs)
router.get('/activities', superAdminController.getAllActivities);

module.exports = router;
