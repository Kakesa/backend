const express = require("express");
const router = express.Router();
const absenceController = require("./absence.controller");
const { protect } = require("../../middlewares/auth.middleware");

const multer = require("multer");
const path = require("path");

// Configure multer for justification uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "justification-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.use(protect);

// Absences - (Base path is /api/absences)
router.get("/", absenceController.getAbsences);
router.get("/student/:studentId", absenceController.getAbsenceByStudent);
router.post("/", absenceController.createAbsence);
router.put("/:id", absenceController.updateAbsence);

// Justifications
router.get("/justifications", absenceController.getJustifications);
router.get("/justifications/student/:studentId", absenceController.getJustificationByStudent);
router.get("/justifications/pending", absenceController.getPendingJustifications);
router.post("/justifications", absenceController.createJustification);
router.put("/justifications/:id/review", absenceController.reviewJustification);
router.post("/justifications/:id/upload", upload.single("file"), absenceController.uploadJustificationFile);

module.exports = router;
