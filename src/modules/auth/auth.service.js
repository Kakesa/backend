const User = require('../users/users.model');
const School = require('../schools/school.model');
const { generateSchoolCode } = require('../schools/school.utils');
const jwt = require('jsonwebtoken');
const { sendActivationEmail } = require('../../services/email.service');

/* =====================================================
   HELPERS
===================================================== */
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET non défini');
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const normalizeEmail = (email) => email.trim().toLowerCase();
const generateOTP = () => ({
  code: Math.floor(100000 + Math.random() * 900000).toString(),
  expires: Date.now() + 10 * 60 * 1000,
});

/* =====================================================
   REGISTER
===================================================== */
const register = async (data) => {
  const { name, email, phone, password, role = 'user', schoolData } = data;

  if (!name || !email || !password) throw new Error('Champs obligatoires manquants');

  const emailNormalized = normalizeEmail(email);
  const existingUser = await User.findOne({ email: emailNormalized });
  if (existingUser) throw new Error('Email déjà utilisé');

  const safeRole = ['admin', 'teacher', 'parent'].includes(role) ? role : 'user';
  const { code: otpCode, expires: otpExpires } = generateOTP();

  // 🔹 Création user
  const user = new User({
    name,
    email: emailNormalized,
    phone,
    password,
    role: safeRole,
    isActive: false,
    needsSchoolSetup: safeRole === 'admin', // true si admin
    otpCode,
    otpExpires,
    otpAttempts: 0,
  });

  await user.save();

  let school = null;

  // 🔹 Si admin ET que schoolData fourni, création immédiate de l'école
  if (safeRole === 'admin' && schoolData && schoolData.name && schoolData.academicYear) {
    const code = await generateSchoolCode();
    school = new School({
      ...schoolData,
      admin: user._id,
      users: [user._id],
      code,
    });
    await school.save();

    user.school = school._id;
    user.needsSchoolSetup = false;
    await user.save();
  }

  // 📧 Envoi OTP
  sendActivationEmail(user.email, otpCode, user.name).catch(console.error);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      school: user.school,
      needsSchoolSetup: user.needsSchoolSetup, // true si admin n'a pas encore créé l'école
    },
    school,
    message: 'Compte créé et code OTP envoyé',
  };
};

/* =====================================================
   ACTIVATE, RESEND OTP & LOGIN
===================================================== */
const resendOTP = async (email) => {
  const emailNormalized = normalizeEmail(email);
  const user = await User.findOne({ email: emailNormalized }).select('+otpCode +otpExpires +otpAttempts');

  if (!user) throw new Error('Utilisateur introuvable');
  if (user.isActive) throw new Error('Compte déjà activé');
  if (user.otpAttempts >= 5) throw new Error('Trop de tentatives');

  const { code, expires } = generateOTP();
  user.otpCode = code;
  user.otpExpires = expires;
  user.otpAttempts += 1;
  await user.save();

  sendActivationEmail(user.email, code, user.name).catch(console.error);
  return { message: 'Nouveau code OTP envoyé' };
};

const activateAccountWithOTP = async ({ email, code }) => {
  const emailNormalized = normalizeEmail(email);
  const user = await User.findOne({ email: emailNormalized }).select('+otpCode +otpExpires +otpAttempts');

  if (!user) throw new Error('Utilisateur introuvable');
  if (user.isActive) throw new Error('Compte déjà activé');
  if (user.otpAttempts >= 5) throw new Error('Trop de tentatives');
  if (user.otpCode !== code || user.otpExpires < Date.now()) {
    user.otpAttempts += 1;
    await user.save();
    throw new Error('Code OTP invalide ou expiré');
  }

  user.isActive = true;
  user.otpCode = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  await user.save();

  return { message: 'Compte activé', token: generateToken(user) };
};

const login = async ({ email, password }) => {
  const emailNormalized = normalizeEmail(email);
  const user = await User.findOne({ email: emailNormalized }).select('+password');

  if (!user) throw new Error('Identifiants incorrects');
  if (!user.isActive) throw new Error('Compte non activé');
  const ok = await user.comparePassword(password);
  if (!ok) throw new Error('Identifiants incorrects');

  return {
    token: generateToken(user),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
      needsSchoolSetup: user.needsSchoolSetup,
    },
  };
};

module.exports = { register, resendOTP, activateAccountWithOTP, login };
