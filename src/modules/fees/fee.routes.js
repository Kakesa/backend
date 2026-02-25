const express = require("express");
const router = express.Router();
const feeController = require("./fee.controller");
const { protect } = require("../../middlewares/auth.middleware");

// Toutes les routes sont protégées
router.use(protect);

// Routes Admin/Staff
router.post("/definitions", feeController.createFeeDefinition);
router.get("/status", feeController.getAllFeeStatuses);
router.post("/payments", feeController.recordPayment);
router.post("/reminders/:studentFeeId", feeController.sendReminder);

// Routes spécifiques par rôle
router.get("/me", feeController.getMyFees); // Student
router.get("/children", feeController.getMyChildrenFees); // Parent
router.get("/class-status", feeController.getClassFeeStatus); // Teacher

// Routes Student/Parent/Admin
router.get("/student/:studentId", feeController.getStudentFees);

module.exports = router;
