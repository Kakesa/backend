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
    // Build data object from body
    const data = { 
      ...req.body, 
      receivedBy: req.user._id 
    };

    // Handle uploaded proof files (if any)
    if (req.files && req.files.length > 0) {
      // convert to relative URLs accessible via /uploads/proofs/...
      const proofs = req.files.map(f => {
        // f.path is absolute, convert to url
        const relative = f.path.split('uploads')[1];
        return `/uploads${relative.replace(/\\/g, '/')}`; // unify slashes
      });
      data.proofs = proofs;
    }

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

/* =====================================================
   GET MY FEES (STUDENT SELF)
===================================================== */
const getMyFees = async (req, res, next) => {
  try {
    const data = await feeService.getMyFees(req.user._id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET MY CHILDREN FEES (PARENT)
===================================================== */
const getMyChildrenFees = async (req, res, next) => {
  try {
    const data = await feeService.getMyChildrenFees(req.user._id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET CLASS FEE STATUS (TEACHER)
===================================================== */
const getClassFeeStatus = async (req, res, next) => {
  try {
    const data = await feeService.getClassFeeStatus(req.user._id, req.query.classId);
    res.status(200).json({ success: true, data });
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
  getMyFees,
  getMyChildrenFees,
  getClassFeeStatus,
};
