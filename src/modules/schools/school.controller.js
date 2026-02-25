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

/* =====================================================
   GET CURRENT SCHOOL
===================================================== */
const getCurrentSchool = async (req, res, next) => {
  try {
    if (!req.user.school) {
      return res.status(404).json({ success: false, message: "Aucune école rattachée à cet utilisateur" });
    }
    const school = await schoolService.getSchoolById(req.user.school, req.user);
    res.status(200).json({ success: true, data: school });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET SCHOOL CODE
===================================================== */
const getSchoolCode = async (req, res, next) => {
  try {
    if (!req.user.school) {
      return res.status(404).json({ success: false, message: "Aucune école rattachée" });
    }
    const school = await School.findById(req.user.school).select('code');
    res.status(200).json({ success: true, data: { code: school.code } });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   REGENERATE SCHOOL CODE
===================================================== */
const regenerateSchoolCode = async (req, res, next) => {
  try {
    if (!req.user.school) {
      return res.status(404).json({ success: false, message: "Aucune école rattachée" });
    }
    const code = await schoolService.regenerateSchoolCode(req.user.school, req.user);
    res.status(200).json({ success: true, data: { code } });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET JOINED USERS
===================================================== */
const getJoinedUsers = async (req, res, next) => {
  try {
    if (!req.user.school) {
      return res.status(404).json({ success: false, message: "Aucune école rattachée" });
    }
    const history = await schoolService.getJoinedUsersHistory(req.user.school);
    res.status(200).json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET SCHOOL SUBSCRIPTION
===================================================== */
const getSchoolSubscription = async (req, res, next) => {
  try {
    if (!req.user.school) {
      return res.status(404).json({ success: false, message: "Aucune école rattachée" });
    }
    
    const school = await School.findById(req.user.school).select('subscription');
    if (!school) {
      return res.status(404).json({ success: false, message: "École introuvable" });
    }

    res.status(200).json({ success: true, data: school.subscription });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  getCurrentSchool,
  getSchoolCode,
  regenerateSchoolCode,
  getJoinedUsers,
  getSchoolSubscription,
};
