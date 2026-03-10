const { FeeDefinition, StudentFee, Payment } = require("./fee.model");
const Student = require("../students/student.model");
const { createNotification } = require("../notifications/notification.service");
const { Parent, ParentStudent } = require("../parents/parent.model");
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
  const parent = await Parent.findOne({ userId });
  if (!parent) throw new Error("Profil parent introuvable");

  // Fetch children links
  const links = await ParentStudent.find({ parentId: parent._id })
    .populate("studentId")
    .lean();

  const children = links.map(l => l.studentId).filter(Boolean);

  // Auto-sync fees for school before displaying
  await syncAllStudentFees(parent.schoolId);
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

/**
 * Synchronize all active students with missing fee definitions
 * Ensures no student is left without a fee record they should have.
 */
const syncAllStudentFees = async (schoolId) => {
  const feeDefs = await FeeDefinition.find({ schoolId, status: "ACTIVE" });
  const students = await Student.find({ school: schoolId, status: "ACTIVE" });

  let createdCount = 0;

  for (const feeDef of feeDefs) {
    // Filter students target for this fee
    const targetStudents = students.filter(student => {
      if (!feeDef.targetClasses || feeDef.targetClasses.length === 0) return true;
      return feeDef.targetClasses.some(id => id.toString() === student.class?.toString());
    });

    for (const student of targetStudents) {
      // Check if record exists
      const existing = await StudentFee.findOne({
        studentId: student._id,
        feeDefinitionId: feeDef._id
      });

      if (!existing) {
        await StudentFee.create({
          studentId: student._id,
          feeDefinitionId: feeDef._id,
          schoolId,
          totalAmount: feeDef.amount,
          balance: feeDef.amount,
        });
        createdCount++;
      }
    }
  }

  return createdCount;
};

/**
 * Send automatic reminders for overdue and upcoming fees
 * This function should be called by a scheduled job (cron)
 */
const sendAutomaticReminders = async () => {
  try {
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find all fees with due dates in the next 7 days
    const upcomingFees = await StudentFee.aggregate([
      {
        $match: {
          balance: { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'feedefinitions',
          localField: 'feeDefinitionId',
          foreignField: '_id',
          as: 'feeDefinition'
        }
      },
      {
        $unwind: '$feeDefinition'
      },
      {
        $match: {
          'feeDefinition.dueDate': {
            $gte: today,
            $lte: sevenDaysFromNow
          }
        }
      }
    ]);

    // Find all overdue fees
    const overdueFees = await StudentFee.aggregate([
      {
        $match: {
          balance: { $gt: 0 },
          $or: [
            { lastReminderDate: { $exists: false } },
            { lastReminderDate: { $lte: threeDaysFromNow } }
          ]
        }
      },
      {
        $lookup: {
          from: 'feedefinitions',
          localField: 'feeDefinitionId',
          foreignField: '_id',
          as: 'feeDefinition'
        }
      },
      {
        $unwind: '$feeDefinition'
      },
      {
        $match: {
          'feeDefinition.dueDate': { $lt: today }
        }
      }
    ]);

    // Populate student information
    const upcomingFeesWithStudents = await StudentFee.populate(upcomingFees, { path: 'studentId' });
    const overdueFeesWithStudents = await StudentFee.populate(overdueFees, { path: 'studentId' });

    const allFeesToRemind = [...upcomingFeesWithStudents, ...overdueFeesWithStudents];

    for (const fee of allFeesToRemind) {
      const daysUntilDue = Math.ceil(
        (fee.feeDefinition.dueDate - today) / (1000 * 60 * 60 * 24)
      );

      let reminderType, message, priority;

      if (daysUntilDue < 0) {
        reminderType = 'OVERDUE';
        priority = 'high';
        message = `RAPPEL URGENT: Les frais scolaires "${fee.feeDefinition.name}" de ${fee.studentId.firstName} ${fee.studentId.lastName} sont en retard de ${Math.abs(daysUntilDue)} jour(s). Montant dû: ${fee.balance} $`;
      } else if (daysUntilDue <= 3) {
        reminderType = 'URGENT';
        priority = 'high';
        message = `RAPPEU: Les frais scolaires "${fee.feeDefinition.name}" de ${fee.studentId.firstName} ${fee.studentId.lastName} sont dus dans ${daysUntilDue} jour(s). Montant: ${fee.balance} $`;
      } else if (daysUntilDue <= 7) {
        reminderType = 'REMINDER';
        priority = 'medium';
        message = `Rappel: Les frais scolaires "${fee.feeDefinition.name}" de ${fee.studentId.firstName} ${fee.studentId.lastName} sont dus dans ${daysUntilDue} jour(s). Montant: ${fee.balance} $`;
      }

      // Send notification to parent
      const parent = await Parent.findOne({ childrenIds: fee.studentId._id });
      if (parent) {
        await createNotification({
          userId: parent.userId || parent._id,
          title: `Rappel de Paiement - ${fee.feeDefinition.name}`,
          message,
          type: reminderType === 'OVERDUE' ? 'error' : 'warning',
          priority,
          metadata: {
            studentFeeId: fee._id,
            studentId: fee.studentId._id,
            amount: fee.balance,
            dueDate: fee.feeDefinition.dueDate,
            reminderType
          }
        });
      }

      // Update last reminder date
      await StudentFee.findByIdAndUpdate(fee._id, { lastReminderDate: new Date() });
    }

    console.log(`Processed ${allFeesToRemind.length} automatic reminders`);
    return {
      upcoming: upcomingFees.length,
      overdue: overdueFees.length,
      total: allFeesToRemind.length
    };
  } catch (error) {
    console.error('Error in automatic reminders:', error);
    throw error;
  }
};

/**
 * Get fee reminders statistics for dashboard
 */
const getReminderStats = async (schoolId) => {
  const today = new Date();
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const stats = await StudentFee.aggregate([
    {
      $match: {
        schoolId,
        balance: { $gt: 0 }
      }
    },
    {
      $lookup: {
        from: 'feedefinitions',
        localField: 'feeDefinitionId',
        foreignField: '_id',
        as: 'feeDefinition'
      }
    },
    {
      $unwind: '$feeDefinition'
    },
    {
      $group: {
        _id: {
          $cond: [
            { $lt: ['$feeDefinition.dueDate', today] },
            'overdue',
            { $lte: ['$feeDefinition.dueDate', sevenDaysFromNow] },
            'upcoming',
            'future'
          ]
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$balance' }
      }
    }
  ]);

  return {
    overdue: stats.find(s => s._id === 'overdue')?.count || 0,
    upcoming: stats.find(s => s._id === 'upcoming')?.count || 0,
    future: stats.find(s => s._id === 'future')?.count || 0,
    totalOverdueAmount: stats.find(s => s._id === 'overdue')?.totalAmount || 0
  };
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
  syncAllStudentFees,
  sendAutomaticReminders,
  getReminderStats,
};
