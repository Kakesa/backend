const express = require("express");
const router = express.Router();
const subjectController = require("./subject.controller");
const { protect } = require("../../middlewares/auth.middleware");

// Protections
router.use(protect);

router.get("/", subjectController.getAllSubjects);
router.get("/:id", subjectController.getSubjectById);
router.post("/", subjectController.createSubject);
router.put("/:id", subjectController.updateSubject);
router.delete("/:id", subjectController.deleteSubject);

module.exports = router;
