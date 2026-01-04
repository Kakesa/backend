const express = require('express');
const router = express.Router();

const {
  register,
  activateAccount,
  login,
  getAllUsers,
  updatePermissions,
  deleteUser,
} = require('./auth.controller');

const { registerValidation, loginValidation } = require('./auth.validation');
const { validate } = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');
const { checkPermission } = require('../../middlewares/permission.middleware');

// ======================================
// AUTH ROUTES
// ======================================
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

// ✅ Activation compte (GET)
router.get('/activate/:token', activateAccount);

// ======================================
// USERS (ADMIN)
// ======================================
router.get('/users', protect, restrictTo('admin'), getAllUsers);

router.put(
  '/users/:id/permissions',
  protect,
  restrictTo('admin'),
  checkPermission('users', 'update'),
  updatePermissions
);

router.delete(
  '/users/:id',
  protect,
  restrictTo('admin'),
  checkPermission('users', 'delete'),
  deleteUser
);

module.exports = router;
