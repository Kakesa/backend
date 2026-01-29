const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../users/users.model');
const School = require('../schools/school.model');
const { sendActivationEmail } = require('../../services/email.service');

const OTP_EXPIRATION_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

/* ================= HELPERS ================= */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateSchoolCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

/* =====================================================
   REGISTER
===================================================== */
const register = async ({ email, password, name, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error('Un utilisateur avec cet email existe déjà');

  const otpCode = generateOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  // ⚠️ Suppression du role par défaut
  const userData = {
    email,
    name,
    password, // hashé via pre('save') dans le model
    isActive: false,
    otpCode,
    otpExpires,
    otpAttempts: 0,
  };

  // Si un rôle est fourni à l'inscription, on l'ajoute
  if (role) userData.role = role;

  const user = await User.create(userData);

  try {
    await sendActivationEmail(user.email, otpCode, user.name);
  } catch (err) {
    console.error('📧 OTP non envoyé :', err.message);
  }

  return { message: 'Compte créé. Code OTP envoyé.' };
};

/* =====================================================
   ACTIVATE ACCOUNT WITH OTP
===================================================== */
const activateAccountWithOTP = async ({ email, code }) => {
  const user = await User.findOne({ email }).select('+otpCode +otpExpires');
  if (!user) throw new Error('Utilisateur introuvable');
  if (user.isActive) throw new Error('Compte déjà activé');

  // 🔥 Normalisation
  const normalizedCode = String(code).trim();

  if (!user.otpCode || user.otpCode !== normalizedCode)
    throw new Error('Code OTP incorrect');

  if (!user.otpExpires || user.otpExpires < new Date())
    throw new Error('Code OTP expiré');

  user.isActive = true;
  user.otpCode = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  await user.save();

  const token = signToken(user);
  return { message: 'Compte activé avec succès', token, user };
};


/* =====================================================
   RESEND OTP
===================================================== */
const resendOTP = async (email) => {
  const user = await User.findOne({ email }).select('+otpAttempts');

  if (!user) throw new Error('Utilisateur introuvable');
  if (user.isActive) throw new Error('Compte déjà activé');

  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    throw new Error('Trop de tentatives OTP. Réessayez plus tard.');
  }

  const otpCode = generateOTP();
  user.otpCode = otpCode;
  user.otpExpires = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
  user.otpAttempts += 1;

  await user.save();

  try {
    await sendActivationEmail(user.email, otpCode, user.name);
  } catch (err) {
    console.error('📧 Renvoi OTP échoué :', err.message);
  }

  return { message: 'Nouveau code OTP envoyé' };
};

/* =====================================================
   LOGIN (SUPER ADMIN OK)
===================================================== */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user) throw new Error('Email ou mot de passe incorrect');

  // 🔥 SUPER ADMIN BYPASS OTP
  if (user.role !== 'superadmin' && !user.isActive) {
    throw new Error('Compte non activé');
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Email ou mot de passe incorrect');

  const token = signToken(user);
  return { token, user };
};

/* =====================================================
   CREATE SCHOOL
===================================================== */
const createSchool = async (userId, { name }) => {
  const user = await User.findById(userId);

  if (!user || !user.isActive) throw new Error('Non autorisé');
  if (user.school) throw new Error('Déjà rattaché à une école');

  const school = await School.create({
    name,
    code: generateSchoolCode(),
    admin: user._id,
  });

  user.role = 'admin';
  user.school = school._id;
  user.needsSchoolSetup = false;
  await user.save();

  return { message: 'École créée', schoolCode: school.code, school };
};

/* =====================================================
   JOIN SCHOOL
===================================================== */
const joinSchoolWithCode = async (userId, schoolCode) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) throw new Error('Non autorisé');
  if (user.school) throw new Error('Déjà rattaché');

  const school = await School.findOne({ code: schoolCode });
  if (!school) throw new Error('Code école invalide');

  user.school = school._id;
  await user.save();

  return { message: 'Rattaché à l’école', schoolId: school._id };
};

/* =====================================================
   ADMIN USERS
===================================================== */
const getAllUsers = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const data = await User.find().skip(skip).limit(limit);
  const total = await User.countDocuments();
  return { data, pagination: { page, limit, total } };
};

const updatePermissions = async (id, permissions) => {
  const user = await User.findByIdAndUpdate(id, { permissions }, { new: true });
  if (!user) throw new Error('Utilisateur introuvable');
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error('Utilisateur introuvable');
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
