const { Role, Permission, UserRoleAssignment } = require("./role.model");

/* =====================================================
   ROLE SERVICE
===================================================== */
const createRole = async (data) => {
  const { name, schoolId, permissions } = data;
  const role = new Role({ name, schoolId });
  await role.save();

  if (permissions && Array.isArray(permissions)) {
    const perms = permissions.map(p => ({ ...p, roleId: role._id }));
    await Permission.insertMany(perms);
  }

  return role;
};

const getRoles = async (schoolId) => {
  return await Role.find({ schoolId }).lean();
};

const getRoleById = async (id) => {
  const role = await Role.findById(id).lean();
  if (!role) throw { statusCode: 404, message: "Rôle introuvable" };
  
  role.permissions = await Permission.find({ roleId: id }).lean();
  return role;
};

/* =====================================================
   PERMISSION CHECK
===================================================== */
const checkPermission = async (userId, moduleName, action) => {
  const assignments = await UserRoleAssignment.find({ userId }).distinct("roleId");
  const permissions = await Permission.find({ 
    roleId: { $in: assignments },
    module: moduleName 
  });

  return permissions.some(p => p[action] === true);
};

/* =====================================================
   USER ASSIGNMENT
===================================================== */
const assignRole = async (userId, roleId) => {
  return await UserRoleAssignment.findOneAndUpdate(
    { userId, roleId },
    { userId, roleId },
    { upsert: true, new: true }
  );
};

const getRoleUsers = async (roleId) => {
  return await UserRoleAssignment.find({ roleId })
    .populate("userId", "firstName lastName email")
    .lean();
};

module.exports = {
  createRole,
  getRoles,
  getRoleById,
  checkPermission,
  assignRole,
  getRoleUsers,
};
