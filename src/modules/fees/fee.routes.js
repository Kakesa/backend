const express = require("express");
const router = express.Router();
const feeController = require("./fee.controller");
const { protect } = require("../../middlewares/auth.middleware");
const multer = require('multer');
const path = require('path');

// --- multer configuration for payment proofs ---
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '../../uploads/proofs');
    // ensure directory exists
    const fs = require('fs');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const proofUpload = multer({
  storage: proofStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // up to 10 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Type de fichier non autorisé pour justificatif'));
    }
    cb(null, true);
  }
});

// Toutes les routes sont protégées
router.use(protect);

const restrictTo = require("../../middlewares/role.middleware");

// Routes Admin/Staff
router.post("/definitions", restrictTo("accountant", "superadmin"), feeController.createFeeDefinition);
router.get("/status", restrictTo("admin", "accountant", "superadmin"), feeController.getAllFeeStatuses);
router.post("/payments", restrictTo("accountant", "superadmin"), proofUpload.array('proofs', 5), feeController.recordPayment);
router.post("/reminders/:studentFeeId", restrictTo("accountant", "superadmin"), feeController.sendReminder);

// Routes spécifiques par rôle
router.get("/me", feeController.getMyFees); // Student
router.get("/children", feeController.getMyChildrenFees); // Parent
router.get("/class-status", feeController.getClassFeeStatus); // Teacher

// Routes Student/Parent/Admin
router.get("/student/:studentId", feeController.getStudentFees);

module.exports = router;
