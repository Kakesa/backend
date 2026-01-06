const authService = require('./auth.service');
const User = require('../users/users.model');
const { createAudit } = require('../audit/audit.service');

/* =====================================================
   REGISTER
===================================================== */
const register = async (req, res, next) => {
  try {
    const { user, school } = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: { user, school },
      message: 'Compte créé, vérifiez votre email (code OTP)',
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   ACTIVATE ACCOUNT WITH OTP
===================================================== */
const activateWithOTP = async (req, res, next) => {
  try {
    const result = await authService.activateAccountWithOTP(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   RESEND OTP
===================================================== */

const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email requis' });

    const result = await authService.resendOTP(email);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   LOGIN
===================================================== */
const login = async (req, res, next) => {
  try {
    const { token, user } = await authService.login(req.body);

    res.status(200).json({
      success: true,
      data: { token, user },
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET ALL USERS
===================================================== */
const getAllUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await authService.getAllUsers(page, limit);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   UPDATE PERMISSIONS
===================================================== */
const updatePermissions = async (req, res, next) => {
  try {
    const before = await User.findById(req.params.id).lean();
    if (!before) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    const user = await authService.updatePermissions(req.params.id, req.body.permissions);

    await createAudit({
      req,
      action: 'UPDATE_PERMISSIONS',
      target: { type: 'User', id: user._id },
      before,
      after: user,
    });

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   DELETE USER
===================================================== */
const deleteUser = async (req, res, next) => {
  try {
    if (req.user && req.user._id.toString() === req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas vous supprimer vous-même',
      });
    }

    const before = await User.findById(req.params.id).lean();
    if (!before) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    await authService.deleteUser(req.params.id);

    await createAudit({
      req,
      action: 'DELETE_USER',
      target: { type: 'User', id: req.params.id },
      before,
      after: null,
    });

    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès',
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   EXPORTS
===================================================== */
module.exports = {
  register,
  activateWithOTP,
  resendOTP,
  login,
  getAllUsers,
  updatePermissions,
  deleteUser,
};
