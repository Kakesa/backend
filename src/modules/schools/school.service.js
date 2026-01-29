const School = require('./school.model');
const User = require('../users/users.model');
const { generateSchoolCode } = require('./school.utils');
const path = require('path');
const fs = require('fs');

/* =====================================================
   CREATE SCHOOL
===================================================== */
const createSchool = async (data, file) => {
  const adminId = data.createdBy;

  const admin = await User.findById(adminId);
  if (!admin) throw new Error("Administrateur introuvable");

  if (admin.school) {
    throw new Error("Cet administrateur a déjà une école");
  }

  const code = await generateSchoolCode();

  let logoPath = "";
  if (file) {
    logoPath = `/uploads/${path.basename(file.path)}`;
  }

  const school = await School.create({
    ...data,
    code,
    logo: logoPath,
    users: [adminId],
    createdBy: adminId,
  });

  admin.school = school._id;
  admin.needsSchoolSetup = false;
  await admin.save();

  return school;
};

/* =====================================================
   GET ALL SCHOOLS (RBAC)
===================================================== */
const getAllSchools = async (user, page = 1, limit = 10) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const skip = (safePage - 1) * safeLimit;

  let filter = {};

  if (user.role !== "superadmin") {
    if (!user.school) throw new Error("Aucune école associée");
    filter = { _id: user.school };
  }

  const [schools, total] = await Promise.all([
    School.find(filter)
      .skip(skip)
      .limit(safeLimit)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email"),
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
   GET SCHOOL BY ID (SECURED)
===================================================== */
const getSchoolById = async (id, user) => {
  const school = await School.findById(id).populate(
    'createdBy',
    'name email'
  );

  if (!school) throw new Error('École introuvable');

  if (user.role !== 'superadmin' && String(school._id) !== String(user.school)) {
    throw new Error('Accès non autorisé à cette école');
  }

  return school;
};

/* =====================================================
   UPDATE SCHOOL
===================================================== */
const updateSchool = async (id, data, file, user) => {
  const school = await School.findById(id);
  if (!school) throw new Error('École introuvable');

  if (user.role !== 'superadmin' && String(school._id) !== String(user.school)) {
    throw new Error('Accès non autorisé');
  }

  if (file) {
    // Supprimer ancien logo
    if (school.logo) {
      const oldPath = path.join(__dirname, '../..', school.logo);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    school.logo = `/uploads/${path.basename(file.path)}`;
  }

  Object.assign(school, data);
  await school.save();

  return school;
};

/* =====================================================
   DELETE SCHOOL
===================================================== */
const deleteSchool = async (id, user) => {
  const school = await School.findById(id);
  if (!school) throw new Error('École introuvable');

  if (user.role !== 'superadmin') {
    throw new Error('Seul le superadmin peut supprimer une école');
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
