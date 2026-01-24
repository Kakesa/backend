const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../users/users.model');
const School = require('../schools/school.model');
const { sendActivationEmail } = require('../../services/email.service');

const OTP_EXPIRATION_MINUTES = 10;

/* ================= HELPERS ================= */
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateSchoolCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

/* =====================================================
   REGISTER (Étape 1)
===================================================== */
const register = async ({ email, password, name }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error('Un utilisateur avec cet email existe déjà');

  const otpCode = generateOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  const user = await User.create({
    email,
    name,
    password,
    role: 'student',
    isActive: false,
    otpCode,
    otpExpires,
    otpAttempts: 0,
  });

  await sendActivationEmail(user.email, otpCode, user.name);

  return { message: 'Compte créé. Un code OTP a été envoyé par email.' };
};

/* =====================================================
   ACTIVATE ACCOUNT WITH OTP (Étape 2)
===================================================== */
const activateAccountWithOTP = async ({ email, code }) => {
  const user = await User.findOne({ email }).select('+otpCode +otpExpires');
  if (!user) throw new Error('Utilisateur introuvable');
  if (user.isActive) throw new Error('Compte déjà activé');

  if (!user.otpCode || user.otpCode !== code)
    throw new Error('Code OTP incorrect');

  if (user.otpExpires < new Date())
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
  const user = await User.findOne({ email });
  if (!user) throw new Error('Utilisateur introuvable');
  if (user.isActive) throw new Error('Compte déjà activé');

  const otpCode = generateOTP();
  user.otpCode = otpCode;
  user.otpExpires = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);
  user.otpAttempts += 1;

  await user.save();
  await sendActivationEmail(user.email, otpCode, user.name);

  return { message: 'Nouveau code OTP envoyé par email' };
};

/* =====================================================
   LOGIN
===================================================== */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new Error('Email ou mot de passe incorrect');
  if (!user.isActive) throw new Error('Compte non activé');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Email ou mot de passe incorrect');

  const token = signToken(user);
  return { token, user };
};

/* =====================================================
   CREATE SCHOOL (ADMIN – Étape 3)
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

  user.role = 'admin'; // ✅ enum correct
  user.school = school._id;
  user.needsSchoolSetup = false;
  await user.save();

  return { message: 'École créée', schoolCode: school.code, school };
};

/* =====================================================
   JOIN SCHOOL WITH CODE (Étape 4)
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
   USERS (ADMIN)
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
