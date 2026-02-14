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
  
  // Retourner le user avec mustChangePassword
  const userObject = user.toObject();
  delete userObject.password;
  
  return { token, user: userObject };
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

  // 🔄 Mettre à jour le profil lié (Student ou Teacher)
  if (user.role === 'student') {
    const Student = require('../students/student.model');
    await Student.findOneAndUpdate(
      { userId: user._id },
      { school: school._id, status: 'ACTIVE' }
    );
  } else if (user.role === 'teacher') {
    const Teacher = require('../teachers/teacher.model');
    await Teacher.findOneAndUpdate(
      { userId: user._id },
      { schoolId: school._id, status: 'ACTIVE' }
    );
  }

  return { 
    message: `Rattaché à l’école ${school.name}`, 
    schoolId: school._id,
    schoolName: school.name 
  };
};

// Les fonctions getAllUsers, updatePermissions et deleteUser ont été déplacées 
// vers le module 'users' pour une meilleure séparation des responsabilités.


/* =====================================================
   REGISTER STUDENT (Auto-inscription)
===================================================== */
const registerStudent = async ({ email, password, firstName, lastName, dateOfBirth, gender, phone }) => {
  const Student = require('../students/student.model');
  
  // Vérifier si l'email existe déjà
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) throw new Error('Un utilisateur avec cet email existe déjà');

  const existingStudent = await Student.findOne({ email: email.toLowerCase().trim() });
  if (existingStudent) throw new Error('Un élève avec cet email existe déjà');

  const otpCode = generateOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

  // Créer le User
  const user = await User.create({
    email: email.toLowerCase().trim(),
    name: `${firstName} ${lastName}`,
    password, // hashé via pre('save') dans le model
    role: 'student',
    isActive: false,
    otpCode,
    otpExpires,
    otpAttempts: 0,
    mustChangePassword: false, // L'élève a choisi son propre mot de passe
  });

  // Créer le Student (sans école pour l'instant)
  const student = await Student.create({
    firstName,
    lastName,
    email: email.toLowerCase().trim(),
    phone: phone || '',
    dateOfBirth: new Date(dateOfBirth),
    gender: gender.toUpperCase(),
    userId: user._id,
    status: 'INACTIVE', // Sera activé après validation OTP et rattachement à une école
  });

  try {
    await sendActivationEmail(user.email, otpCode, user.name);
  } catch (err) {
    console.error('📧 OTP non envoyé :', err.message);
  }

  return { message: 'Compte élève créé. Code OTP envoyé.', studentId: student._id };
};

/* =====================================================
   CHANGE PASSWORD
===================================================== */
const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new Error('Utilisateur introuvable');

  // Vérifier l'ancien mot de passe
  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw new Error('Ancien mot de passe incorrect');

  // Mettre à jour le mot de passe
  user.password = newPassword; // Sera hashé via pre('save')
  user.mustChangePassword = false;
  await user.save();

  return { message: 'Mot de passe changé avec succès' };
};

module.exports = {
  register,
  activateAccountWithOTP,
  resendOTP,
  login,
  createSchool,
  joinSchoolWithCode,
  registerStudent,
  changePassword,
};
