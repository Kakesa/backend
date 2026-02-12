const express = require("express");
const router = express.Router();
const userController = require("./user.controller");
const { protect } = require("../../middlewares/auth.middleware");

// Protect all routes
router.use(protect);

// GET routes
router.get("/", userController.getAllUsers);
router.get("/school/:schoolId", userController.getUsersBySchool);
router.get("/:id", userController.getUserById);

// POST routes
router.post("/", userController.createUser);

// PUT routes
router.put("/:id", userController.updateUser);
router.put("/:id/status", userController.updateUserStatus);

// DELETE routes
router.delete("/:id", userController.deleteUser);

module.exports = router;
