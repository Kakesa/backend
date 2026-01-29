const schoolService = require('./school.service');

/* =====================================================
   CREATE SCHOOL
===================================================== */
const createSchool = async (req, res, next) => {
  try {
    const data = {
      ...req.body,
      createdBy: req.user._id,
      admin: req.user._id, // <-- important : défini l'admin de l'école
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
   GET ALL SCHOOLS
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

module.exports = {
  createSchool,
  getAllSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
};
