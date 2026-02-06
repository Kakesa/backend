const express = require("express");
const router = express.Router();
const absenceController = require("./absence.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

// Absences
router.get("/absences", absenceController.getAbsences);
router.get("/absences/student/:studentId", absenceController.getAbsenceByStudent);
router.post("/absences", absenceController.createAbsence);
router.put("/absences/:id", absenceController.updateAbsence);

// Justifications
router.get("/justifications", absenceController.getJustifications);
router.get("/justifications/student/:studentId", absenceController.getJustificationByStudent);
router.get("/justifications/pending", absenceController.getPendingJustifications);
router.post("/justifications", absenceController.createJustification);
router.put("/justifications/:id/review", absenceController.reviewJustification);

module.exports = router;
