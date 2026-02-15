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
  return await StudentFee.find({ studentId })
    .populate("feeDefinitionId")
    .lean();
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
const sendReminder = async (studentFeeId) => {
  const studentFee = await StudentFee.findById(studentFeeId)
    .populate("studentId")
    .populate("feeDefinitionId");

  if (!studentFee) throw new Error("Frais introuvable");

  // Envoyer notification (Logique simplifiée pour l'instant)
  // En situation réelle, on chercherait le userId du student ou du parent
  if (studentFee.studentId.userId) {
    await createNotification({
      recipient: studentFee.studentId.userId,
      title: "Rappel de paiement",
      message: `Rappel : Il reste un solde de ${studentFee.balance} USD pour ${studentFee.feeDefinitionId.name}.`,
      type: "FEE_REMINDER",
    });
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

  // Filtrer par classe si nécessaire (car populate ne filtre pas la requête principale facilement ici)
  if (classId) {
    return results.filter(r => r.studentId && r.studentId.class && r.studentId.class._id.toString() === classId);
  }

  return results;
};

module.exports = {
  createFeeDefinition,
  getStudentFees,
  recordPayment,
  sendReminder,
  getAllFeeStatuses,
};
