const School = require('./school.model');
const User = require('../users/users.model');
const { generateSchoolCode } = require('./school.utils');
const fs = require('fs');
const path = require('path');

/* =====================================================
   CREATE SCHOOL
===================================================== */
const createSchool = async (data, file) => {
  const adminId = data.admin;

  const admin = await User.findById(adminId);
  if (!admin) throw new Error("Administrateur introuvable");
  if (admin.needsSchoolSetup === false) throw new Error("École déjà configurée pour cet administrateur");

  // Génération du code
  const code = await generateSchoolCode();

  // 🔹 Si fichier logo présent → on le sauvegarde
  let logoPath = null;
  if (file) {
    const ext = path.extname(file.originalname);
    const fileName = `school-${Date.now()}${ext}`;
    const filePath = path.join(__dirname, '../../uploads', fileName);
    fs.writeFileSync(filePath, file.buffer);
    logoPath = `/uploads/${fileName}`;
  }

  // Création école
  const school = await School.create({
    ...data,
    code,
    logo: logoPath,
    users: [adminId],
  });

  // Lier user ↔ school
  admin.school = school._id;
  admin.needsSchoolSetup = false;
  await admin.save();

  return school;
};

/* =====================================================
   GET ALL SCHOOLS (RBAC + MULTI-ÉTABLISSEMENTS)
===================================================== */
const getAllSchools = async (user, page = 1, limit = 10) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const skip = (safePage - 1) * safeLimit;

  let filter = {};

  // 🔐 ADMIN → seulement son école
  if (user.role !== "superadmin") {
    if (!user.school) {
      throw new Error("Aucune école associée à cet utilisateur");
    }
    filter = { _id: user.school };
  }

  const [schools, total] = await Promise.all([
    School.find(filter)
      .skip(skip)
      .limit(safeLimit)
      .sort({ createdAt: -1 })
      .populate("admin", "name email"),
    School.countDocuments(filter),
  ]);

  return {
    data: schools,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

/* =====================================================
   GET SCHOOL BY ID
===================================================== */
const getSchoolById = async (id) => {
  const school = await School.findById(id).populate('admin', 'name email');
  if (!school) {
    throw new Error('École introuvable');
  }
  return school;
};

/* =====================================================
   UPDATE SCHOOL
===================================================== */
const updateSchool = async (id, data, file) => {
  let logoPath = data.logo || undefined;

  if (file) {
    const ext = path.extname(file.originalname);
    const fileName = `school-${Date.now()}${ext}`;
    const filePath = path.join(__dirname, '../../uploads', fileName);
    fs.writeFileSync(filePath, file.buffer);
    logoPath = `/uploads/${fileName}`;
  }

  const school = await School.findByIdAndUpdate(
    id,
    { ...data, logo: logoPath },
    { new: true }
  );

  if (!school) throw new Error('École introuvable');
  return school;
};

/* =====================================================
   DELETE SCHOOL
===================================================== */
const deleteSchool = async (id) => {
  const school = await School.findById(id);
  if (!school) {
    throw new Error('École introuvable');
  }
  await school.deleteOne();
};

module.exports = {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
};
