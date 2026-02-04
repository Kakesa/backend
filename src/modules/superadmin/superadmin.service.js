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

module.exports = {
  getAllSchoolsWithStats,
  getSchoolWithStatsById,
  getGlobalStats,
  getAllActivities,
  toggleSchoolStatus,
};
