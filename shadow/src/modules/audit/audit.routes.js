const express = require('express');
const router = express.Router();

const { getAudits } = require('./audit.controller');
const { protect } = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware'); // export direct

// GET /api/audits - uniquement admin ou superadmin
router.get(
  '/',
  protect,
  restrictTo('superadmin', 'admin'),
  getAudits
);

module.exports = router;
