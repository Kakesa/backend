const schoolService = require('./school.service');
const School = require('./school.model');
const User = require('../users/users.model');

/* =====================================================
   CREATE SCHOOL
===================================================== */
const createSchool = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      createdBy: req.user._id,
      admin: req.user._id,
    };

    const school = await schoolService.createSchool(data, req.file);

    res.status(201).json({
      success: true,
      data: {
        school,
        schoolCode: school.code,
      },
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET ALL SCHOOLS (PAGINATED)
===================================================== */
const getAllSchools = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const result = await schoolService.getAllSchools(req.user, page, limit);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET ALL SCHOOLS WITH STATS (NO SUBSCRIPTION MODULE)
===================================================== */
const getAllSchoolsWithStats = async (req, res, next) => {
  try {
    const schools = await School.find()
      .populate('admin', 'name email')
      .lean();

    const results = await Promise.all(
      schools.map(async (school) => {
        const studentCount = await User.countDocuments({
          school: school._id,
          role: 'student',
        });

        const teacherCount = await User.countDocuments({
          school: school._id,
          role: 'teacher',
        });

        const classCount = school.classes?.length || 0;

        return {
          id: school._id,
          name: school.name,
          code: school.code,
          city: school.city,
          country: school.country,
          address: school.address,
          email: school.email,
          phone: school.phone,
          types: school.types,
          status: school.status,

          adminName: school.admin?.name || null,
          adminEmail: school.admin?.email || null,

          studentCount,
          teacherCount,
          classCount,

          // 🔥 FAKE subscription (frontend-safe)
          subscription: {
            plan: 'free',
            status: 'trial',
            startDate: null,
            endDate: null,
            amount: 0,
            currency: 'CDF',
            autoRenew: false,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

const getAllActivities = async (req, res, next) => {
  try {
    const activities = await schoolService.getAllActivities();
    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (err) {
    next(err);
  }
};
/* =====================================================
   GET SCHOOL BY ID
===================================================== */
const getSchoolById = async (req, res, next) => {
  try {
    const school = await schoolService.getSchoolById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: school,
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   UPDATE SCHOOL
===================================================== */
const updateSchool = async (req, res, next) => {
  try {
    const school = await schoolService.updateSchool(
      req.params.id,
      req.body,
      req.file,
      req.user
    );

    res.status(200).json({
      success: true,
      data: school,
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   DELETE SCHOOL
===================================================== */
const deleteSchool = async (req, res, next) => {
  try {
    await schoolService.deleteSchool(req.params.id, req.user);
    res.status(200).json({
      success: true,
      message: 'École supprimée avec succès',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSchool,
  getAllSchools,
  getAllSchoolsWithStats,
  getAllActivities,
  getSchoolById,
  updateSchool,
  deleteSchool,
};
