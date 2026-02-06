const express = require("express");
const router = express.Router();
const evaluationController = require("./evaluation.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

// Competences
router.get("/competences", evaluationController.getCompetences);
router.get("/competences/:id", evaluationController.getCompetenceById);
router.post("/competences", evaluationController.createCompetence);

// Evaluations
router.get("/student/:studentId", evaluationController.getStudentEvaluations);
router.get("/progress/:studentId/:competenceId", evaluationController.getProgress);
router.post("/", evaluationController.createEvaluation);

module.exports = router;
