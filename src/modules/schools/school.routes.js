const express = require('express');
const router = express.Router();

const {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
} = require('./school.controller');

const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');
const { schoolSetup } = require('../../middlewares/schoolSetup.middleware');
const { schoolScope } = require('../../middlewares/schoolScope.middleware');

// 🔹 Toutes les routes sont protégées
router.use(protect);

// GET /schools
router.get(
  "/",
  restrictTo("superadmin", "admin"),
  schoolScope,
  getAllSchools
);

// GET /schools/:id
router.get('/:id', restrictTo('admin'), getSchoolById);

// POST /schools
router.post('/', restrictTo('admin'), schoolSetup, createSchool);

// PUT /schools/:id
router.put('/:id', restrictTo('admin'), updateSchool);

// DELETE /schools/:id
router.delete('/:id', restrictTo('admin'), deleteSchool);

module.exports = router;
