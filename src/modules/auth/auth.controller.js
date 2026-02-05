const mongoose = require("mongoose");
const authService = require('./auth.service');
const User = require('../users/users.model');
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
      token: result.token,
      user,
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
const joinSchoolWithCode = async (userId, schoolCode) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw {
      statusCode: 400,
      message: "Identifiant utilisateur invalide",
    };
  }

  //  Vérifier l'utilisateur
  const user = await User.findById(userId);

  if (!user) {
    throw {
      statusCode: 404,
      message: "Utilisateur introuvable",
    };
  }

  //  Déjà rattaché
  if (user.school) {
    throw {
      statusCode: 403,
      message:
        "Vous êtes déjà rattaché à une école. Contactez l'administration.",
    };
  }

  //  Vérifier l'école
  const school = await School.findOne({
    code: schoolCode,
    status: "active",
  });

  if (!school) {
    throw {
      statusCode: 404,
      message: "Code école invalide ou école inactive",
    };
  }

  //  Lier user → school
  user.school = school.id;
  user.needsSchoolSetup = false;
  await user.save();

  //  Lier school → user
  await School.findByIdAndUpdate(school.id, {
    $addToSet: { users: user.id },
  });

  return {
    message: `Vous avez rejoint l'école ${school.name}`,
    schoolId: school._id,
  };
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
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable',
      });
    }

    const user = await authService.updatePermissions(
      req.params.id,
      req.body.permissions
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
};
