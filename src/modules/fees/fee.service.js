const { FeeDefinition, StudentFee, Payment } = require("./fee.model");
const Student = require("../students/student.model");
const { createNotification } = require("../notifications/notification.service");

/* =====================================================
   CREATE FEE DEFINITION
===================================================== */
const createFeeDefinition = async (data) => {
  const feeDef = await FeeDefinition.create(data);

  // Automatiquement attribuer ce frais aux élèves des classes cibles
  let studentFilter = { school: data.schoolId, status: "ACTIVE" };
  if (data.targetClasses && data.targetClasses.length > 0) {
    studentFilter.class = { $in: data.targetClasses };
  }

  const students = await Student.find(studentFilter);
  
  const studentFees = students.map(student => ({
    studentId: student._id,
    feeDefinitionId: feeDef._id,
    schoolId: data.schoolId,
    totalAmount: data.amount,
    balance: data.amount,
  }));

  if (studentFees.length > 0) {
    await StudentFee.insertMany(studentFees);
  }

  return feeDef;
};

/* =====================================================
   GET STUDENT FEES
===================================================== */
const getStudentFees = async (studentId) => {
  const fees = await StudentFee.find({ studentId })
    .populate("feeDefinitionId")
    .lean();
  
  return fees.map(f => ({ ...f, id: f._id }));
};

/* =====================================================
   RECORD PAYMENT
===================================================== */
const recordPayment = async (data) => {
  const { studentFeeId, amount, method, reference, receivedBy } = data;

  const studentFee = await StudentFee.findById(studentFeeId);
  if (!studentFee) throw new Error("Frais introuvable");

  if (amount > studentFee.balance) {
    throw new Error("Le montant dépasse le solde restant");
  }

  // Créer la transaction
  const payment = await Payment.create({
    studentId: studentFee.studentId,
    studentFeeId: studentFee._id,
    schoolId: studentFee.schoolId,
    amount,
    method,
    reference,
    receivedBy,
  });

  // Mettre à jour le StudentFee
  studentFee.amountPaid += amount;
  await studentFee.save();

  return payment;
};

/* =====================================================
   SEND REMINDER
===================================================== */
const sendReminder = async (studentFeeId, senderId) => {
  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(studentFeeId)) {
    throw new Error("ID de frais invalide");
  }

  const studentFee = await StudentFee.findById(studentFeeId)
    .populate({
      path: "studentId",
      populate: { path: "userId" }
    })
    .populate("feeDefinitionId");

  if (!studentFee) throw new Error("Frais introuvable");

  const student = studentFee.studentId;
  const studentName = `${student.firstName} ${student.lastName}`;
  const feeName = studentFee.feeDefinitionId.name;
  const balance = studentFee.balance;

  // 1. Notification interne (App)
  if (student.userId) {
    await createNotification({
      recipient: student.userId._id,
      title: "Rappel de paiement",
      message: `Rappel : Il reste un solde de ${balance} USD pour ${feeName}.`,
      type: "FEE_REMINDER",
    });

    // Optionnel : Envoyer aussi un Message interne
    try {
      const { sendMessage } = require("../messages/message.service");
      await sendMessage({
        senderId: senderId, 
        recipientId: student.userId._id,
        content: `Ceci est un rappel automatique concernant les frais : ${feeName}. Solde restant : ${balance} USD.`,
        subject: "Rappel Frais Scolaires"
      });
    } catch (msgErr) {
      console.error("Erreur envoi message interne:", msgErr.message);
    }
  }

  // 2. Email (si disponible)
  if (student.email) {
    try {
      const { sendFeeReminderEmail } = require("../../services/email.service");
      await sendFeeReminderEmail(student.email, studentName, feeName, balance);
    } catch (emailErr) {
      console.error("Erreur envoi email:", emailErr.message);
    }
  }

  studentFee.lastReminderDate = new Date();
  await studentFee.save();

  return true;
};

/* =====================================================
   GET ALL STATUS (ADMIN)
===================================================== */
const getAllFeeStatuses = async (schoolId, query = {}) => {
  const { classId, status } = query;
  const filter = { schoolId };
  if (status) filter.status = status;

  let populateQuery = {
    path: "studentId",
    select: "firstName lastName matricule class",
    populate: { path: "class", select: "name" }
  };

  const results = await StudentFee.find(filter)
    .populate(populateQuery)
    .populate("feeDefinitionId")
    .lean();

  const normalizedResults = results.map(r => ({ ...r, id: r._id }));

  // Filtrer par classe si nécessaire
  if (classId) {
    return normalizedResults.filter(r => r.studentId && r.studentId.class && r.studentId.class._id.toString() === classId);
  }

  return normalizedResults;
};

/* =====================================================
   CHECK STUDENT PAYMENT STATUS (FOR TEACHERS/STAFF)
===================================================== */
const checkStudentPaymentStatus = async (studentId) => {
  const fees = await StudentFee.find({ studentId });
  
  if (fees.length === 0) return { isPaid: true, status: "NO_FEES" };

  const unpaidFees = fees.filter(f => f.status !== "PAID");
  
  return {
    isPaid: unpaidFees.length === 0,
    status: unpaidFees.length === 0 ? "PAID" : "UNPAID",
    unpaidCount: unpaidFees.length
  };
};

module.exports = {
  createFeeDefinition,
  getStudentFees,
  recordPayment,
  sendReminder,
  getAllFeeStatuses,
  checkStudentPaymentStatus,
};
