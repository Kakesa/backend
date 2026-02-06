const express = require("express");
const router = express.Router();
const evaluationController = require("./evaluation.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

// Competences
router.get("/", evaluationController.getCompetences);
router.get("/:id", evaluationController.getCompetenceById);
router.post("/", evaluationController.createCompetence);
router.put("/:id", evaluationController.updateCompetence);
router.delete("/:id", evaluationController.deleteCompetence);

module.exports = router;
