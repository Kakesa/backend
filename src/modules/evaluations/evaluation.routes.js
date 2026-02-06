const express = require("express");
const router = express.Router();
const evaluationController = require("./evaluation.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

// Evaluations
router.get("/student/:studentId", evaluationController.getStudentEvaluations);
router.get("/progress/:studentId/:competenceId", evaluationController.getProgress);
router.post("/", evaluationController.createEvaluation);
router.put('/:id', evaluationController.updateEvaluation);
router.delete('/:id', evaluationController.deleteEvaluation);

module.exports = router;
