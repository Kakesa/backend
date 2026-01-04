const User = require('../users/users.model');
const jwt = require('jsonwebtoken');

/* =====================================================
   HELPERS
===================================================== */
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET non défini');
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const normalizeEmail = (email) => email.trim().toLowerCase();

/* =====================================================
   REGISTER
===================================================== */
const register = async (data) => {
  const {
    name,
    email,
    phone,
    password,
    role = 'student',
  } = data;

  // 🔒 Validation minimale
  if (!name || !email || !password) {
    throw new Error('Nom, email et mot de passe requis');
  }

  const emailNormalized = normalizeEmail(email);

  const existingUser = await User.findOne({ email: emailNormalized });
  if (existingUser) {
    throw new Error('Email déjà utilisé');
  }

  // 🔐 Rôles autorisés
  const allowedRoles = ['admin', 'teacher', 'student', 'parent'];
  const safeRole = allowedRoles.includes(role) ? role : 'student';

  const user = new User({
    name,
    email: emailNormalized,
    phone,
    password, // hash automatique (pre save)
    role: safeRole,
    permissions: [],
    school: null, // sera défini après création école (ADMIN)
  });

  await user.save();

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
    },
  };
};

/* =====================================================
   LOGIN
===================================================== */
const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email et mot de passe requis');
  }

  const emailNormalized = normalizeEmail(email);

  const user = await User.findOne({ email: emailNormalized })
    .select('+password');

  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  if (!user.isActive) {
    throw new Error('Compte désactivé');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new Error('Email ou mot de passe incorrect');
  }

  const token = generateToken(user);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
    },
  };
};

/* =====================================================
   GET ALL USERS (ADMIN)
===================================================== */
const getAllUsers = async (page = 1, limit = 10) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const skip = (safePage - 1) * safeLimit;

  const [users, total] = await Promise.all([
    User.find()
      .select('-password')
      .populate('school', 'name code')
      .skip(skip)
      .limit(safeLimit)
      .sort({ createdAt: -1 }),
    User.countDocuments(),
  ]);

  return {
    data: users,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

/* =====================================================
   UPDATE PERMISSIONS (ADMIN)
===================================================== */
const updatePermissions = async (userId, permissions) => {
  if (!Array.isArray(permissions)) {
    throw new Error('Permissions invalides');
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { permissions },
    { new: true }
  ).select('-password');

  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  return user;
};

/* =====================================================
   DELETE USER
===================================================== */
const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Utilisateur introuvable');
  }

  // 🚨 Empêcher suppression du dernier admin
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new Error(
        'Impossible de supprimer le dernier administrateur'
      );
    }
  }

  await user.deleteOne();
};

/* =====================================================
   EXPORTS
===================================================== */
module.exports = {
  register,
  login,
  getAllUsers,
  updatePermissions,
  deleteUser,
};
