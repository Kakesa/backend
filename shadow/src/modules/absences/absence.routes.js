const express = require("express");
const router = express.Router();
const absenceController = require("./absence.controller");
const { protect } = require("../../middlewares/auth.middleware");
const restrictTo = require("../../middlewares/role.middleware");

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

// Routes pour les professeurs (protect est déjà appliqué dans routes.js)
router.get("/teacher/my-classes", restrictTo("teacher", "admin"), absenceController.getTeacherClassesAbsences);
router.get("/teacher/class/:classId", restrictTo("teacher", "admin"), absenceController.getClassAbsences);
router.post("/teacher/mark", restrictTo("teacher", "admin"), absenceController.markAbsence);
router.put("/teacher/:id", restrictTo("teacher", "admin"), absenceController.updateTeacherAbsence);
router.get("/teacher/justifications/pending", restrictTo("teacher", "admin"), absenceController.getPendingTeacherJustifications);
router.put("/teacher/justifications/:id/review", restrictTo("teacher", "admin"), absenceController.reviewTeacherJustification);

// Routes administratives existantes
router.get("/", restrictTo("admin", "superadmin", "teacher"), absenceController.getAbsences);
router.get("/student/:studentId", restrictTo("admin", "superadmin", "parent", "teacher"), absenceController.getAbsenceByStudent);
router.post("/", restrictTo("admin", "superadmin", "teacher"), absenceController.createAbsence);
router.put("/:id", restrictTo("admin", "superadmin"), absenceController.updateAbsence);

// Justifications
router.get("/justifications", restrictTo("admin", "superadmin", "teacher"), absenceController.getJustifications);
router.get("/justifications/student/:studentId", restrictTo("admin", "superadmin", "parent", "teacher"), absenceController.getJustificationByStudent);
router.get("/justifications/pending", restrictTo("admin", "superadmin", "teacher"), absenceController.getPendingJustifications);
router.post("/justifications", restrictTo("admin", "superadmin", "parent", "student"), absenceController.createJustification);
router.put("/justifications/:id/review", restrictTo("admin", "superadmin", "teacher"), absenceController.reviewJustification);
router.post("/justifications/:id/upload", upload.single("file"), absenceController.uploadJustificationFile);

module.exports = router;
