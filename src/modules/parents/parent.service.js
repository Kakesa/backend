const { Parent, ParentStudent } = require("./parent.model");
const User = require("../users/users.model");

/* =====================================================
   CREATE PARENT
===================================================== */
const createParent = async (data, createdByAdmin = false) => {
  // 🔐 Créer ou trouver le compte User
  let userId = null;
  if (data.email) {
    const normalizedEmail = data.email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    
    if (!existingUser) {
      const newUser = await User.create({
        name: `${data.firstName} ${data.lastName}`,
        email: normalizedEmail,
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

    // 🔍 Vérifier si un Parent document existe déjà avec cet email
    const existingParent = await Parent.findOne({ email: normalizedEmail });
    if (existingParent) {
      // Lier le userId si pas encore fait
      if (!existingParent.userId && userId) {
        existingParent.userId = userId;
        await existingParent.save();
      }
      return existingParent;
    }
  }

  if (userId) {
    // Vérifier aussi si un Parent document existe déjà avec ce userId
    const existingParentByUserId = await Parent.findOne({ userId });
    if (existingParentByUserId) {
      return existingParentByUserId;
    }
    data.userId = userId;
  }

  // 🆔 Générer un matricule si absent
  if (!data.matricule) {
    const year = new Date().getFullYear();
    const count = await Parent.countDocuments({ schoolId: data.schoolId });
    data.matricule = `PAR-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  const parent = new Parent(data);
  return await parent.save();
};

/* =====================================================
   LINK CHILD TO PARENT
===================================================== */
const linkChild = async (parentId, studentId, relation) => {
  // Éviter les doublons
  const existing = await ParentStudent.findOne({ parentId, studentId });
  if (existing) return existing;

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

  const parents = await Parent.find(filter)
    .sort({ lastName: 1, firstName: 1 })
    .lean();

  // Enrich parents with relationship and children IDs to avoid UI crashes
  const enrichedParents = await Promise.all(parents.map(async (parent) => {
    const links = await ParentStudent.find({ parentId: parent._id })
      .populate("studentId", "firstName lastName")
      .lean();
    
    return {
      ...parent,
      id: parent._id, // Add id for frontend compatibility
      childrenIds: links.map(l => l.studentId?._id?.toString() || l.studentId?.toString()),
      children: links.map(l => ({
        id: l.studentId?._id,
        name: l.studentId ? `${l.studentId.firstName} ${l.studentId.lastName}` : "Inconnu"
      })),
      relationship: links.length > 0 ? links[0].relation : "Parent",
      registrationDate: parent.createdAt // Fallback for UI
    };
  }));

  return enrichedParents;
};

/* =====================================================
   GET PARENT BY ID (WITH CHILDREN)
===================================================== */
const getParentById = async (id) => {
  // Try findById first, then fallback to userId lookup
  let parent = null;
  try {
    parent = await Parent.findById(id).lean();
  } catch (e) {
    // Invalid ObjectId for Parent — might be a User ID
  }
  if (!parent) {
    // Fallback: maybe `id` is a User ID, not a Parent document ID
    parent = await Parent.findOne({ userId: id }).lean();
  }
  if (!parent) {
    // Fallback by email: parent may have been created by admin without userId link
    const user = await User.findById(id).lean();
    if (user && user.email) {
      parent = await Parent.findOne({ email: user.email.toLowerCase().trim() }).lean();
      // Auto-link userId for future lookups
      if (parent) {
        await Parent.findByIdAndUpdate(parent._id, { userId: id });
      }
    }
  }
  if (!parent) throw { statusCode: 404, message: "Parent introuvable" };

  // Use parent._id (not the input `id` which may be a userId)
  const parentDocId = parent._id;

  // Fetch children links
  const links = await ParentStudent.find({ parentId: parentDocId })
    .populate("studentId", "firstName lastName matricule photo")
    .lean();
  
  parent.id = parentDocId;
  parent.childrenIds = links
    .map(l => l.studentId?._id?.toString())
    .filter(Boolean);
  parent.children = links.map(l => ({
    ...l.studentId,
    id: l.studentId?._id?.toString(),
    name: l.studentId ? `${l.studentId.firstName} ${l.studentId.lastName}` : "Inconnu",
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
