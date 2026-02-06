const express = require("express");
const router = express.Router();
const classController = require("./class.controller");
const { protect } = require("../../middlewares/auth.middleware");

// All routes are protected
router.use(protect);

router.get("/", classController.getAllClasses);
router.get("/:id", classController.getClassById);
router.post("/", classController.createClass);
router.put("/:id", classController.updateClass);
router.delete("/:id", classController.deleteClass);

module.exports = router;
