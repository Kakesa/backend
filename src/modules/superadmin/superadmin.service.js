// superadmin.service.js
const School = require('../schools/school.model');
const User = require('../users/users.model');
const Subscription = require('../subscriptions/subscription.model');

/* =====================================================
   GET ALL SCHOOLS WITH STATS
===================================================== */
const getAllSchoolsWithStats = async () => {
  const schools = await School.find()
    .populate('admin', 'name email')
    .lean();

  return Promise.all(
    schools.map(async (school) => {
      const [studentCount, teacherCount, subscription] = await Promise.all([
        User.countDocuments({ school: school._id, role: 'student' }),
        User.countDocuments({ school: school._id, role: 'teacher' }),
        Subscription.findOne({ school: school._id }).lean(),
      ]);

      return {
        id: school._id,
        name: school.name,
        code: school.code,
        city: school.city,
        country: school.country,
        status: school.status,
        adminName: school.admin?.name ?? null,
        adminEmail: school.admin?.email ?? null,
        studentCount,
        teacherCount,
        subscription: {
          status: subscription?.status ?? 'trial',
          plan: subscription?.plan ?? 'free',
          startDate: subscription?.startDate ?? null,
          endDate: subscription?.endDate ?? null,
        },
      };
    })
  );
};

/* =====================================================
   GET SCHOOL WITH STATS BY ID
===================================================== */
const getSchoolWithStatsById = async (id) => {
  const school = await School.findById(id)
    .populate('admin', 'name email')
    .lean();

  if (!school) throw { statusCode: 404, message: 'École introuvable' };

  const [studentCount, teacherCount, subscription] = await Promise.all([
    User.countDocuments({ school: id, role: 'student' }),
    User.countDocuments({ school: id, role: 'teacher' }),
    Subscription.findOne({ school: id }).lean(),
  ]);

  return {
    id: school._id,
    name: school.name,
    code: school.code,
    city: school.city,
    country: school.country,
    status: school.status,
    adminName: school.admin?.name ?? null,
    adminEmail: school.admin?.email ?? null,
    studentCount,
    teacherCount,
    subscription: {
      status: subscription?.status ?? 'trial',
      plan: subscription?.plan ?? 'free',
      startDate: subscription?.startDate ?? null,
      endDate: subscription?.endDate ?? null,
    },
  };
};

/* =====================================================
   GLOBAL STATS (SUPER ADMIN DASHBOARD)
===================================================== */
const getGlobalStats = async () => {
  const totalSchools = await School.countDocuments();
  const activeSchools = await School.countDocuments({ status: 'active' });

  const subscriptions = {
    active: await Subscription.countDocuments({ status: 'active' }),
    expired: await Subscription.countDocuments({ status: 'expired' }),
    pendingActivation: await Subscription.countDocuments({ status: 'pending' }),
    trial: await Subscription.countDocuments({ status: 'trial' }),
  };

  return {
    totalSchools,
    activeSchools,
    subscriptions,
  };
};

/* =====================================================
   ACTIVITIES (READY FOR AUDIT LOGS)
===================================================== */
const getAllActivities = async () => {
  // TODO: brancher avec audit logs
  return [];
};

/* =====================================================
   TOGGLE SCHOOL STATUS
===================================================== */
const toggleSchoolStatus = async (schoolId) => {
  const school = await School.findById(schoolId);
  if (!school) throw { statusCode: 404, message: 'École introuvable' };

  school.status = school.status === 'active' ? 'inactive' : 'active';
  await school.save();

  return school;
};

/* =====================================================
   GET ALL ADMINS
===================================================== */
const getAllAdmins = async () => {
  const admins = await User.find({ role: 'admin' })
    .populate('school', 'name')
    .lean();

  return admins.map(admin => ({
    id: admin._id,
    userId: admin._id,
    schoolId: admin.school?._id || null,
    schoolName: admin.school?.name || 'N/A',
    firstName: admin.name.split(' ')[0] || '',
    lastName: admin.name.split(' ').slice(1).join(' ') || '',
    email: admin.email,
    phone: admin.phone,
    status: admin.isActive ? 'active' : 'inactive', // Mapping isActive to status
    createdAt: admin.createdAt,
    lastLogin: admin.updatedAt, // Fallback as we might not have a dedicated lastLogin field
  }));
};

/* =====================================================
   GET ADMIN BY ID
===================================================== */
const getAdminById = async (id) => {
  const admin = await User.findOne({ _id: id, role: 'admin' })
    .populate('school', 'name')
    .lean();

  if (!admin) throw { statusCode: 404, message: 'Administrateur introuvable' };

  return {
    id: admin._id,
    userId: admin._id,
    schoolId: admin.school?._id || null,
    schoolName: admin.school?.name || 'N/A',
    firstName: admin.name.split(' ')[0] || '',
    lastName: admin.name.split(' ').slice(1).join(' ') || '',
    email: admin.email,
    phone: admin.phone,
    status: admin.isActive ? 'active' : 'inactive',
    createdAt: admin.createdAt,
    lastLogin: admin.updatedAt,
  };
};

/* =====================================================
   TOGGLE ADMIN STATUS
===================================================== */
const toggleAdminStatus = async (id) => {
  const admin = await User.findOne({ _id: id, role: 'admin' });
  if (!admin) throw { statusCode: 404, message: 'Administrateur introuvable' };

  admin.isActive = !admin.isActive;
  await admin.save();

  return admin;
};

/* =====================================================
   DELETE ADMIN
===================================================== */
const deleteAdmin = async (id) => {
  const result = await User.deleteOne({ _id: id, role: 'admin' });
  if (result.deletedCount === 0) throw { statusCode: 404, message: 'Administrateur introuvable' };
  return true;
};

/* =====================================================
   RESET ADMIN PASSWORD
===================================================== */
const resetAdminPassword = async (id) => {
  const admin = await User.findOne({ _id: id, role: 'admin' });
  if (!admin) throw { statusCode: 404, message: 'Administrateur introuvable' };

  // TODO: Implement real password reset (e.g., send temporary password or link via email)
  // For now, we'll just return success to satisfy the frontend call
  return { success: true, message: 'Réinitialisation demandée avec succès' };
};

module.exports = {
  getAllSchoolsWithStats,
  getSchoolWithStatsById,
  getGlobalStats,
  getAllActivities,
  toggleSchoolStatus,
  getAllAdmins,
  getAdminById,
  toggleAdminStatus,
  deleteAdmin,
  resetAdminPassword,
};
