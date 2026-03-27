const express = require('express');
const router = express.Router();

// 🔹 Controllers
const { upsertSubscription, getBySchool, getStats } = require('./subscription.controller');

// 🔹 Middlewares
const { protect } = require('../../middlewares/auth.middleware');
const { requireAdmin } = require('../../middlewares/checkAdmin.middleware');
const checkSuperAdmin = require('../../middlewares/checkSuperAdmin.middleware');

// ADMIN ÉCOLE
router.post('/', protect, requireAdmin, upsertSubscription);
router.get('/school/:schoolId', protect, requireAdmin, getBySchool);

// SUPER ADMIN
router.get('/stats', protect, checkSuperAdmin, getStats);

module.exports = router;
