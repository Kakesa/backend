const { FeeDefinition, StudentFee, Payment } = require("./fee.model");
const Student = require("../students/student.model");
const { createNotification } = require("../notifications/notification.service");
const Parent = require("../parents/parent.model");
const Teacher = require("../teachers/teacher.model");

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
  
  // pour chaque frais, récupérer les paiements liés (incluant justificatifs)
  const enriched = await Promise.all(fees.map(async f => {
    const payments = await Payment.find({ studentFeeId: f._id }).lean();
    return { 
      ...f, 
      id: f._id,
      payments: payments.map(p => ({
        ...p,
        id: p._id
      }))
    };
  }));

  return enriched;
};

/* =====================================================
   RECORD PAYMENT
===================================================== */
const recordPayment = async (data) => {
  const { studentFeeId, amount, method, reference, invoiceNumber, receivedBy, proofs } = data;

  const studentFee = await StudentFee.findById(studentFeeId);
  if (!studentFee) throw new Error("Frais introuvable");

  if (amount > studentFee.balance) {
    throw new Error("Le montant dépasse le solde restant");
  }

  // Créer la transaction
  const paymentData = {
    studentId: studentFee.studentId,
    studentFeeId: studentFee._id,
    schoolId: studentFee.schoolId,
    amount,
    method,
    reference,
    invoiceNumber,
    receivedBy,
  };

  if (proofs && Array.isArray(proofs)) {
    paymentData.proofs = proofs;
  }

  const payment = await Payment.create(paymentData);

  // Mettre à jour le StudentFee
  studentFee.amountPaid += amount;
  await studentFee.save();

  // Notify student (and optionally parent) about payment record
  try {
    const student = await Student.findById(studentFee.studentId).populate('userId');
    if (student && student.userId) {
      let message = `Un paiement de ${amount} a été enregistré pour ${student.firstName} ${student.lastName}.`;
      if (payment.proofs && payment.proofs.length > 0) {
        message += ` Justificatif disponible : ${payment.proofs.join(', ')}`;
      }
      await createNotification({
        userId: student.userId._id,
        title: 'Paiement enregistré',
        message,
        type: 'info',
      });
      // optionally email
      // si un email est défini, on pourrait envoyer un message de confirmation ici
      // (la fonctionnalité n'est pas implémentée dans le service SMTP actuel)
    }
  } catch (notifErr) {
    console.error('Erreur notification paiement:', notifErr.message);
  }

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
      userId: student.userId._id,
      title: "Rappel de paiement",
      message: `Rappel : Il reste un solde de ${balance} USD pour ${feeName}.`,
      type: "info",
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

/* =====================================================
   GET MY FEES (FOR LOGGED-IN STUDENT)
===================================================== */
const getMyFees = async (userId) => {
  const student = await Student.findOne({ userId });
  if (!student) throw new Error("Profil étudiant introuvable");
  return getStudentFees(student._id);
};

/* =====================================================
   GET MY CHILDREN FEES (FOR LOGGED-IN PARENT)
===================================================== */
const getMyChildrenFees = async (userId) => {
  const parent = await Parent.findOne({ userId }).populate("children");
  if (!parent) throw new Error("Profil parent introuvable");

  const children = parent.children || [];
  const results = [];

  for (const child of children) {
    const fees = await StudentFee.find({ studentId: child._id })
      .populate("feeDefinitionId")
      .lean();

    const enrichedFees = await Promise.all(fees.map(async f => {
      const payments = await Payment.find({ studentFeeId: f._id }).lean();
      return {
        ...f,
        id: f._id,
        payments: payments.map(p => ({ ...p, id: p._id })),
      };
    }));

    results.push({
      student: {
        id: child._id,
        firstName: child.firstName,
        lastName: child.lastName,
        matricule: child.matricule,
        class: child.class,
      },
      fees: enrichedFees,
    });
  }

  return results;
};

/* =====================================================
   GET CLASS FEE STATUS (FOR TEACHERS)
===================================================== */
const getClassFeeStatus = async (userId, classId) => {
  let studentFilter = {};

  if (classId) {
    studentFilter.class = classId;
  } else {
    // Find teacher's classes
    const teacher = await Teacher.findOne({ userId }).populate("classes");
    if (teacher && teacher.classes && teacher.classes.length > 0) {
      studentFilter.class = { $in: teacher.classes.map(c => c._id || c) };
    }
  }

  const students = await Student.find(studentFilter)
    .populate("class", "name")
    .lean();

  const results = [];
  for (const student of students) {
    const fees = await StudentFee.find({ studentId: student._id }).lean();
    const totalBalance = fees.reduce((acc, f) => acc + f.balance, 0);
    const allPaid = fees.length > 0 && fees.every(f => f.status === "PAID");
    const anyUnpaid = fees.some(f => f.status === "UNPAID" || f.status === "PARTIAL");

    results.push({
      studentId: student._id,
      firstName: student.firstName,
      lastName: student.lastName,
      matricule: student.matricule,
      class: student.class,
      feeStatus: fees.length === 0 ? "NO_FEES" : allPaid ? "PAID" : anyUnpaid ? "UNPAID" : "PARTIAL",
      totalBalance,
      feeCount: fees.length,
    });
  }

  return results;
};

module.exports = {
  createFeeDefinition,
  getStudentFees,
  recordPayment,
  sendReminder,
  getAllFeeStatuses,
  checkStudentPaymentStatus,
  getMyFees,
  getMyChildrenFees,
  getClassFeeStatus,
};
