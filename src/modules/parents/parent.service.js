const { Parent, ParentStudent } = require("./parent.model");

/* =====================================================
   CREATE PARENT
===================================================== */
const createParent = async (data) => {
  const parent = new Parent(data);
  return await parent.save();
};

/* =====================================================
   LINK CHILD TO PARENT
===================================================== */
const linkChild = async (parentId, studentId, relation) => {
  const link = new ParentStudent({ parentId, studentId, relation });
  return await link.save();
};

/* =====================================================
   GET ALL PARENTS
===================================================== */
const getAllParents = async (query = {}) => {
  const { schoolId } = query;
  const filter = {};
  if (schoolId) filter.schoolId = schoolId;

  return await Parent.find(filter)
    .sort({ lastName: 1, firstName: 1 })
    .lean();
};

/* =====================================================
   GET PARENT BY ID (WITH CHILDREN)
===================================================== */
const getParentById = async (id) => {
  const parent = await Parent.findById(id).lean();
  if (!parent) throw { statusCode: 404, message: "Parent introuvable" };

  // Fetch children links
  const links = await ParentStudent.find({ parentId: id })
    .populate("studentId", "firstName lastName matricule photo")
    .lean();
  
  parent.children = links.map(l => ({
    ...l.studentId,
    relation: l.relation,
    linkId: l._id
  }));

  return parent;
};

/* =====================================================
   UPDATE PARENT
===================================================== */
const updateParent = async (id, data) => {
  const parent = await Parent.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!parent) throw { statusCode: 404, message: "Parent introuvable" };
  return parent;
};

/* =====================================================
   DELETE PARENT
===================================================== */
const deleteParent = async (id) => {
  // Delete links first
  await ParentStudent.deleteMany({ parentId: id });
  const result = await Parent.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw { statusCode: 404, message: "Parent introuvable" };
  return true;
};

module.exports = {
  createParent,
  linkChild,
  getAllParents,
  getParentById,
  updateParent,
  deleteParent,
};
