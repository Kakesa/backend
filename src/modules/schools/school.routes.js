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

// 🔹 Toutes les routes sont protégées
router.use(protect);

// GET /schools
router.get('/', restrictTo('admin'), getAllSchools);

// GET /schools/:id
router.get('/:id', restrictTo('admin'), getSchoolById);

// POST /schools
router.post('/', restrictTo('admin'), createSchool);

// PUT /schools/:id
router.put('/:id', restrictTo('admin'), updateSchool);

// DELETE /schools/:id
router.delete('/:id', restrictTo('admin'), deleteSchool);

module.exports = router;
