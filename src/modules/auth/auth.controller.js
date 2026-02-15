const mongoose = require("mongoose");
const authService = require('./auth.service');
const User = require('../users/users.model');
const userService = require('../users/user.service');
const { createAudit } = require('../audit/audit.service');

/* =====================================================
   REGISTER — Étape 1
===================================================== */
const register = async (req, res, next) => {
  try {
    await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'Compte créé. Un code OTP a été envoyé par email.',
      data: { message: 'Compte créé' } 
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   ACTIVATE ACCOUNT WITH OTP — Étape 2
===================================================== */
const activateAccountWithOTP = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email et code OTP requis',
      });
    }

    const result = await authService.activateAccountWithOTP({
      email: email.toLowerCase().trim(),
      code: String(code).trim(),
    });

    // 🔒 Nettoyage user
    const user = result.user.toObject();
    delete user.password;
    delete user.otpCode;
    delete user.otpExpires;

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        token: result.token,
        user,
      }
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
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis',
      });
    }

    const result = await authService.resendOTP(email.toLowerCase().trim());

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
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
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
      });
    }

    const { token, user } = await authService.login({
      email: email.toLowerCase().trim(),
      password,
    });

    await createAudit({
      req,
      action: 'LOGIN',
      target: { type: 'User', id: user._id },
      before: null,
      after: user,
    });

    res.status(200).json({
      success: true,
      data: { token, user },
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   CREATE SCHOOL — Étape 3
===================================================== */
const createSchool = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Nom de l’école requis',
      });
    }

    const result = await authService.createSchool(req.user._id, { name });

    await createAudit({
      req,
      action: 'CREATE_SCHOOL',
      target: { type: 'School', id: result.school._id },
      before: null,
      after: result.school,
    });

    res.status(201).json({
      success: true,
      message: result.message,
      schoolCode: result.schoolCode,
      school: result.school,
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   JOIN SCHOOL WITH CODE — Étape 4
===================================================== */
const joinSchoolWithCode = async (req, res, next) => {
  try {
    const { schoolCode } = req.body;
    if (!schoolCode) {
      return res.status(400).json({
        success: false,
        message: 'Code école requis',
      });
    }

    const result = await authService.joinSchoolWithCode(req.user._id, schoolCode);

    await createAudit({
      req,
      action: 'JOIN_SCHOOL',
      target: { type: 'School', id: result.schoolId },
      before: null,
      after: { userId: req.user._id, schoolId: result.schoolId },
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
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

    const result = await userService.getAllUsers({ page, limit });

    res.status(200).json({
      success: true,
      data: result.users || result, // Handle different return structures
      pagination: result.pagination || { page, limit },
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
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }

    const user = await userService.updateUser(
      req.params.id,
      { permissions: req.body.permissions }
    );

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
    if (req.user._id.toString() === req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas vous supprimer vous-même',
      });
    }

    const before = await User.findById(req.params.id).lean();
    if (!before) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }

    await userService.deleteUser(req.params.id);

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

const getMe = async (req, res) => {
  try {
    const userObject = req.user.toObject();
    let linkedProfile = null;

    if (userObject.role === 'teacher') {
      const Teacher = require('../teachers/teacher.model');
      linkedProfile = await Teacher.findOne({ userId: userObject._id });
    } else if (userObject.role === 'student') {
      const Student = require('../students/student.model');
      linkedProfile = await Student.findOne({ userId: userObject._id });
    } else if (userObject.role === 'parent') {
      const Parent = require('../parents/parent.model');
      linkedProfile = await Parent.findOne({ userId: userObject._id });
    }

    res.status(200).json({
      success: true,
      data: {
        ...userObject,
        linkedProfile
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   REGISTER STUDENT (Auto-inscription)
===================================================== */
const registerStudent = async (req, res, next) => {
  try {
    const result = await authService.registerStudent(req.body);

    res.status(201).json({
      success: true,
      message: result.message,
      data: { 
        studentId: result.studentId,
        message: result.message
      }
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   CHANGE PASSWORD
===================================================== */
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Ancien et nouveau mot de passe requis',
      });
    }

    const result = await authService.changePassword(req.user._id, {
      oldPassword,
      newPassword,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
