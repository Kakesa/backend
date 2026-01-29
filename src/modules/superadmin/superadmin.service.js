const School = require('../schools/school.model');
const User = require('../users/users.model');

const getAllSchoolsWithStats = async () => {
  const schools = await School.find()
    .populate('admin', 'name email')
    .lean();

  return Promise.all(
    schools.map(async (school) => {
      const studentCount = await User.countDocuments({
        school: school._id,
        role: 'student',
      });

      const teacherCount = await User.countDocuments({
        school: school._id,
        role: 'teacher',
      });

      return {
        id: school._id,
        name: school.name,
        code: school.code,
        city: school.city,
        country: school.country,
        status: school.status,
        adminName: school.admin?.name || null,
        adminEmail: school.admin?.email || null,
        studentCount,
        teacherCount,
      };
    })
  );
};

const getSchoolWithStatsById = async (id) => {
  const school = await School.findById(id).populate('admin', 'name email');
  if (!school) throw { statusCode: 404, message: 'École introuvable' };

  const users = await User.countDocuments({ school: id });

  return { school, users };
};

const getGlobalStats = async () => {
  const totalSchools = await School.countDocuments();
  const totalUsers = await User.countDocuments();

  return {
    totalSchools,
    totalUsers,
  };
};

const getAllActivities = async () => {
  return []; // prêt pour audit logs
};

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
