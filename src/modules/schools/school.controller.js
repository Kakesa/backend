const schoolService = require('./school.service');

/* =====================================================
   CREATE SCHOOL
===================================================== */
const createSchool = async (req, res, next) => {
  try {
    const data = { ...req.body, admin: req.user._id }; // admin connecté
    const school = await schoolService.createSchool(data);
    res.status(201).json({ success: true, data: school });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET ALL SCHOOLS
===================================================== */
const getAllSchools = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await schoolService.getAllSchools(page, limit);
    res.status(200).json({ success: true, data: result.data, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET SCHOOL BY ID
===================================================== */
const getSchoolById = async (req, res, next) => {
  try {
    const school = await schoolService.getSchoolById(req.params.id);
    res.status(200).json({ success: true, data: school });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   UPDATE SCHOOL
===================================================== */
const updateSchool = async (req, res, next) => {
  try {
    const school = await schoolService.updateSchool(req.params.id, req.body);
    res.status(200).json({ success: true, data: school });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   DELETE SCHOOL
===================================================== */
const deleteSchool = async (req, res, next) => {
  try {
    await schoolService.deleteSchool(req.params.id);
    res.status(200).json({ success: true, message: 'École supprimée avec succès' });
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
};
