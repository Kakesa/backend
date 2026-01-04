const School = require('./school.model');

/* =====================================================
   CREATE SCHOOL
===================================================== */
const createSchool = async (data) => {
  const school = new School(data);
  await school.save();
  return school;
};

/* =====================================================
   GET ALL SCHOOLS
===================================================== */
const getAllSchools = async (page = 1, limit = 10) => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const skip = (safePage - 1) * safeLimit;

  const [schools, total] = await Promise.all([
    School.find().skip(skip).limit(safeLimit).sort({ createdAt: -1 }).populate('admin', 'name email'),
    School.countDocuments(),
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
const updateSchool = async (id, data) => {
  const school = await School.findByIdAndUpdate(id, data, { new: true });
  if (!school) {
    throw new Error('École introuvable');
  }
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
