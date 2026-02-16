const feeService = require("./fee.service");

/* =====================================================
   CREATE FEE DEFINITION
===================================================== */
const createFeeDefinition = async (req, res, next) => {
  try {
    const data = { ...req.body, schoolId: req.user.school || req.user.schoolId };
    const feeDef = await feeService.createFeeDefinition(data);
    res.status(201).json({ success: true, data: feeDef });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET STUDENT FEES
===================================================== */
const getStudentFees = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    const data = await feeService.getStudentFees(studentId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   RECORD PAYMENT
===================================================== */
const recordPayment = async (req, res, next) => {
  try {
    const data = { 
      ...req.body, 
      receivedBy: req.user._id 
    };
    const payment = await feeService.recordPayment(data);
    res.status(201).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   SEND REMINDER
===================================================== */
const sendReminder = async (req, res, next) => {
  try {
    const senderId = req.user._id;
    await feeService.sendReminder(req.params.studentFeeId, senderId);
    res.status(200).json({ success: true, message: "Rappel envoyé avec succès" });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET ALL FEE STATUSES (ADMIN)
===================================================== */
const getAllFeeStatuses = async (req, res, next) => {
  try {
    const schoolId = req.user.school || req.user.schoolId;
    const results = await feeService.getAllFeeStatuses(schoolId, req.query);
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createFeeDefinition,
  getStudentFees,
  recordPayment,
  sendReminder,
  getAllFeeStatuses,
};
