const User = require('../users/users.model');
const School = require('../schools/school.model');
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

const generateOTP = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return { code, expires };
};

/* =====================================================
   REGISTER (OTP)
===================================================== */
const register = async (data) => {
  const { name, email, phone, password, role = 'user', permissions, schoolData } = data;

  if (!name || !email || !password) throw new Error('Champs obligatoires manquants');

  const emailNormalized = normalizeEmail(email);
  const existingUser = await User.findOne({ email: emailNormalized });
  if (existingUser) throw new Error('Email déjà utilisé');

  const safeRole = role === 'admin' ? 'admin' : 'user';
  const { code: otpCode, expires: otpExpires } = generateOTP();

  const user = new User({
    name,
    email: emailNormalized,
    phone,
    password,
    role: safeRole,
    permissions: Array.isArray(permissions) ? permissions : [],
    isActive: false,
    otpCode,
    otpExpires,
    otpAttempts: 0,
  });

  await user.save();

  // Création école si admin
  let school = null;
  if (safeRole === 'admin' && schoolData) {
    school = new School({ ...schoolData, admin: user._id });
    await school.save();
    user.school = school._id;
    await user.save();
  }

  // 📧 Envoi OTP
  sendActivationEmail(user.email, otpCode, user.name).catch(console.error);

  return {
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
    message: 'Code OTP envoyé par email',
  };
};

/* =====================================================
   RESEND OTP
===================================================== */
const resendOTP = async (email) => {
  const emailNormalized = normalizeEmail(email);
  const user = await User.findOne({ email: emailNormalized }).select('+otpCode +otpExpires +otpAttempts');

  if (!user) throw new Error('Utilisateur introuvable');
  if (user.isActive) throw new Error('Compte déjà activé');

  // Limite de tentatives pour resend
  if (user.otpAttempts >= 5) throw new Error('Nombre maximum de tentatives atteint. Contactez le support.');

  const { code: otpCode, expires: otpExpires } = generateOTP();
  user.otpCode = otpCode;
  user.otpExpires = otpExpires;
  user.otpAttempts += 1;

  await user.save();
  sendActivationEmail(user.email, otpCode, user.name).catch(console.error);

  return { message: 'Nouveau code OTP envoyé par email' };
};

/* =====================================================
   ACTIVATE ACCOUNT WITH OTP
===================================================== */
const activateAccountWithOTP = async ({ email, code }) => {
  if (!email || !code) throw new Error('Email et code requis');

  const emailNormalized = normalizeEmail(email);
  const user = await User.findOne({ email: emailNormalized })
    .select('+otpCode +otpExpires +otpAttempts');

  if (!user) throw new Error('Utilisateur introuvable ou code invalide');
  if (user.isActive) throw new Error('Compte déjà activé');

  // Vérifier tentatives et expiration
  if (user.otpAttempts >= 5) throw new Error('Nombre maximum de tentatives atteint. Contactez le support.');
  if (user.otpCode !== code || user.otpExpires < Date.now()) {
    user.otpAttempts += 1;
    await user.save();
    throw new Error('Code OTP invalide ou expiré');
  }

  // Activation
  user.isActive = true;
  user.otpCode = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  await user.save();

  // Auto-login
  const token = generateToken(user);

  return { message: 'Compte activé avec succès', token };
};

/* =====================================================
   LOGIN
===================================================== */
const login = async ({ email, password }) => {
  if (!email || !password) throw new Error('Email et mot de passe requis');

  const emailNormalized = normalizeEmail(email);
  const user = await User.findOne({ email: emailNormalized }).select('+password +isActive');

  if (!user) throw new Error('Email ou mot de passe incorrect');
  if (!user.isActive) throw new Error('Compte non activé');

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw new Error('Email ou mot de passe incorrect');

  const token = generateToken(user);

  return { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions } };
};

/* =====================================================
   EXPORTS
===================================================== */
module.exports = {
  register,
  resendOTP,
  activateAccountWithOTP,
  login,
};
