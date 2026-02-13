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
  const roles = await Role.find({ schoolId }).lean();
  
  // Fetch permissions for each role
  const rolesWithPermissions = await Promise.all(
    roles.map(async (role) => {
      const permissions = await Permission.find({ roleId: role._id }).lean();
      return {
        ...role,
        permissions: permissions || [],
      };
    })
  );
  
  return rolesWithPermissions;
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

/* =====================================================
   UPDATE ROLE
===================================================== */
const updateRole = async (id, data) => {
  const { name, permissions } = data;
  
  const role = await Role.findByIdAndUpdate(
    id,
    { name },
    { new: true, runValidators: true }
  ).lean();
  
  if (!role) throw { statusCode: 404, message: "Rôle introuvable" };

  // Update permissions if provided
  if (permissions && Array.isArray(permissions)) {
    // Delete existing permissions
    await Permission.deleteMany({ roleId: id });
    
    // Insert new permissions
    if (permissions.length > 0) {
      const perms = permissions.map(p => ({ ...p, roleId: id }));
      await Permission.insertMany(perms);
    }
  }

  return role;
};

/* =====================================================
   DELETE ROLE
===================================================== */
const deleteRole = async (id) => {
  const role = await Role.findById(id);
  if (!role) throw { statusCode: 404, message: "Rôle introuvable" };

  // Delete associated permissions
  await Permission.deleteMany({ roleId: id });
  
  // Delete role assignments
  await UserRoleAssignment.deleteMany({ roleId: id });
  
  // Delete role
  await Role.deleteOne({ _id: id });
  
  return true;
};

/* =====================================================
   UPDATE ROLE PERMISSIONS
===================================================== */
const updateRolePermissions = async (roleId, permissions) => {
  // Delete existing permissions
  await Permission.deleteMany({ roleId });
  
  // Insert new permissions
  if (permissions && permissions.length > 0) {
    const perms = permissions.map(p => ({ ...p, roleId }));
    await Permission.insertMany(perms);
  }
  
  return await Permission.find({ roleId }).lean();
};

module.exports = {
  createRole,
  getRoles,
  getRoleById,
  checkPermission,
  assignRole,
  getRoleUsers,
  updateRole,
  deleteRole,
  updateRolePermissions,
};
