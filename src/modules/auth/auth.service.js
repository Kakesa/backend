const User = require('../users/users.model');
const School = require('../schools/school.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/* =====================================================
   HELPERS
===================================================== */
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET non défini');

  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const normalizeEmail = (email) => email.trim().toLowerCase();

/* =====================================================
   GENERATE ACTIVATION TOKEN
===================================================== */
const generateActivationToken = () => {
  const token = crypto.randomBytes(20).toString('hex');
  const expires = Date.now() + 24 * 60 * 60 * 1000; // 24h
  return { token, expires };
};

/* =====================================================
   REGISTER
===================================================== */
const register = async (data) => {
  const { name, email, phone, password, role = 'user', permissions, schoolData } = data;

  if (!name || !email || !password) {
    throw new Error('Champs obligatoires manquants');
  }

  const emailNormalized = normalizeEmail(email);
  const existingUser = await User.findOne({ email: emailNormalized });
  if (existingUser) throw new Error('Email déjà utilisé');

  const safeRole = role === 'admin' ? 'admin' : 'user';

  // 🔹 Générer token d’activation
  const { token: activationToken, expires: activationExpires } = generateActivationToken();

  const user = new User({
    name,
    email: emailNormalized,
    phone,
    password,
    role: safeRole,
    permissions: Array.isArray(permissions) ? permissions : [],
    isActive: false, // 🔹 inactif jusqu'à activation
    activationToken,
    activationExpires,
  });

  await user.save();

  // ✅ Création automatique d’école pour un admin
  let school = null;
  if (safeRole === 'admin' && schoolData) {
    school = new School({ ...schoolData, admin: user._id });
    await school.save();

    user.school = school._id;
    await user.save();
  }

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
    },
    activationToken, // 🔹 à envoyer par email
    school,
  };
};

/* =====================================================
   ACTIVATE ACCOUNT
===================================================== */
const activateAccount = async (token) => {
  const user = await User.findOne({
    activationToken: token,
    activationExpires: { $gt: Date.now() },
  });

  if (!user) throw new Error('Token invalide ou expiré');

  user.isActive = true;
  user.activationToken = undefined;
  user.activationExpires = undefined;

  await user.save();

  const jwtToken = generateToken(user);

  return {
    token: jwtToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
    },
  };
};

/* =====================================================
   LOGIN
===================================================== */
const login = async ({ email, password }) => {
  if (!email || !password) throw new Error('Email et mot de passe requis');

  const emailNormalized = normalizeEmail(email);
  const user = await User.findOne({ email: emailNormalized }).select('+password +isActive');
  if (!user) throw new Error('Email ou mot de passe incorrect');

  if (!user.isActive) throw new Error('Compte non activé, vérifiez votre email');

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw new Error('Email ou mot de passe incorrect');

  const token = generateToken(user);

  return {
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
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
    User.find().select('-password').skip(skip).limit(safeLimit).sort({ createdAt: -1 }),
    User.countDocuments(),
  ]);

  return {
    data: users,
    pagination: { total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) },
  };
};

/* =====================================================
   UPDATE PERMISSIONS
===================================================== */
const updatePermissions = async (userId, permissions) => {
  if (!Array.isArray(permissions)) throw new Error('Permissions invalides');

  const user = await User.findByIdAndUpdate(userId, { permissions }, { new: true }).select('-password');
  if (!user) throw new Error('Utilisateur introuvable');

  return user;
};

/* =====================================================
   DELETE USER
===================================================== */
const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable');

  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) throw new Error('Impossible de supprimer le dernier administrateur');
  }

  await user.deleteOne();
};

/* =====================================================
   EXPORTS
===================================================== */
module.exports = {
  register,
  activateAccount,
  login,
  getAllUsers,
  updatePermissions,
  deleteUser,
};
