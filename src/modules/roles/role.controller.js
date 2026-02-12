const roleService = require("./role.service");

const getRoles = async (req, res, next) => {
  try {
    const data = await roleService.getRoles(req.query.schoolId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getRoleById = async (req, res, next) => {
  try {
    const data = await roleService.getRoleById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createRole = async (req, res, next) => {
  try {
    const data = await roleService.createRole(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getRoleUsers = async (req, res, next) => {
  try {
    const data = await roleService.getRoleUsers(req.params.roleId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const checkPermission = async (req, res, next) => {
  try {
    const { userId, module, action } = req.query;
    const hasPermission = await roleService.checkPermission(userId, module, action);
    res.status(200).json({ success: true, hasPermission });
  } catch (err) {
    next(err);
  }
};

const assignRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    const data = await roleService.assignRole(userId, roleId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const data = await roleService.updateRole(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    await roleService.deleteRole(req.params.id);
    res.status(200).json({ success: true, message: "Rôle supprimé" });
  } catch (err) {
    next(err);
  }
};

const updateRolePermissions = async (req, res, next) => {
  try {
    const { permissions } = req.body;
    const data = await roleService.updateRolePermissions(req.params.id, permissions);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  getRoleUsers,
  checkPermission,
  assignRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
};
