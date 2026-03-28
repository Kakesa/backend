const express = require("express");
const router = express.Router();
const roleController = require("./role.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

router.get("/", roleController.getRoles);
router.get("/permissions/check", roleController.checkPermission);
router.get("/:id", roleController.getRoleById);
router.get("/:roleId/users", roleController.getRoleUsers);

router.post("/", roleController.createRole);
router.put("/users/:userId/role", roleController.assignRole);
router.put("/:id", roleController.updateRole);
router.put("/:id/permissions", roleController.updateRolePermissions);
router.delete("/:id", roleController.deleteRole);

module.exports = router;
