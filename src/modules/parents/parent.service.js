const { Parent, ParentStudent } = require("./parent.model");
const User = require("../users/users.model");

/* =====================================================
   CREATE PARENT
===================================================== */
const createParent = async (data, createdByAdmin = false) => {
  // 🔐 Si créé par admin ou via inscription, créer un compte User
  let userId = null;
  if (data.email) {
    const existingUser = await User.findOne({ email: data.email.toLowerCase().trim() });
    
    if (!existingUser) {
      const newUser = await User.create({
        name: `${data.firstName} ${data.lastName}`,
        email: data.email.toLowerCase().trim(),
        password: "123456", // Mot de passe par défaut
        role: "parent",
        school: data.schoolId,
        isActive: true,
        mustChangePassword: true,
      });
      userId = newUser._id;
    } else {
      userId = existingUser._id;
      // S'assurer que le rôle est correct
      if (existingUser.role !== 'parent') {
        existingUser.role = 'parent';
        await existingUser.save();
      }
    }
  }

  if (userId) {
    data.userId = userId;
  }

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
