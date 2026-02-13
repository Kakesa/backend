const express = require('express');
const router = express.Router();

const {
  register,
  activateAccountWithOTP,
  resendOTP,
  login,
  createSchool,
  joinSchoolWithCode,
  getAllUsers,
  updatePermissions,
  deleteUser,
  getMe,
  registerStudent,
  changePassword,
} = require('./auth.controller');

const { registerValidation, loginValidation } = require('./auth.validation');
const { validate } = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const restrictTo = require('../../middlewares/role.middleware'); // export direct
const { checkPermission } = require('../../middlewares/permission.middleware');

// -------------------------
// AUTH
// -------------------------
router.post('/register', registerValidation, validate, register);
router.post('/register-student', registerStudent);
router.post('/login', loginValidation, validate, login);
router.post('/activate-otp', activateAccountWithOTP);
router.post('/resend-otp', resendOTP);
router.post('/change-password', protect, changePassword);
router.get('/me', protect, getMe);

// -------------------------
// SCHOOL
// -------------------------
router.post('/schools', protect, restrictTo('superadmin', 'admin'), createSchool);
router.post('/schools/join', protect, joinSchoolWithCode);

// -------------------------
// USERS (ADMIN / SUPERADMIN)
// -------------------------
router.get(
  '/users',
  protect,
  restrictTo('superadmin', 'admin'),
  getAllUsers
);

router.put(
  '/users/:id/permissions',
  protect,
  restrictTo('superadmin', 'admin'),
  checkPermission('users', 'update'),
  updatePermissions
);

router.delete(
  '/users/:id',
  protect,
  restrictTo('superadmin', 'admin'),
  checkPermission('users', 'delete'),
  deleteUser
);

module.exports = router;
