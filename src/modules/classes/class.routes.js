const express = require("express");
const router = express.Router();
const classController = require("./class.controller");
const { protect } = require("../../middlewares/auth.middleware");
const schoolFilter = require("../../middlewares/schoolFilter.middleware");

// All routes are protected
router.use(protect);
router.use(schoolFilter); // Ajout du filtre par école

router.get("/", classController.getAllClasses);
router.get("/level/:level", classController.getClassesByLevel);
router.get("/:id", classController.getClassById);
router.post("/", classController.createClass);
router.put("/:id", classController.updateClass);
router.delete("/:id", classController.deleteClass);

module.exports = router;
