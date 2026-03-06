const { Payment, StudentFee } = require("../fees/fee.model");
const Expense = require("../expenses/expense.model");
const Student = require("../students/student.model");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const getFinanceDashboardStats = async (schoolId) => {
  if (!schoolId) throw new Error("School ID is required");
  const schoolObjectId = new ObjectId(schoolId);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Total Income (All Payments)
  const incomeAgg = await Payment.aggregate([
    { $match: { schoolId: schoolObjectId } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalIncome = incomeAgg[0]?.total || 0;

  // 2. Monthly Income
  const monthlyIncomeAgg = await Payment.aggregate([
    { $match: { schoolId: schoolObjectId, paymentDate: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const monthlyIncome = monthlyIncomeAgg[0]?.total || 0;

  // 3. Total Expenses
  const expenseAgg = await Expense.aggregate([
    { $match: { schoolId: schoolObjectId } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalExpenses = expenseAgg[0]?.total || 0;

  // 4. Monthly Expenses
  const monthlyExpenseAgg = await Expense.aggregate([
    { $match: { schoolId: schoolObjectId, date: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const monthlyExpenses = monthlyExpenseAgg[0]?.total || 0;

  // 5. Debtors Count
  const debtorsCount = await StudentFee.countDocuments({
    schoolId: schoolObjectId,
    status: { $in: ["UNPAID", "PARTIAL"] },
  });

  // 6. Monthly Trends (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const incomeTrend = await Payment.aggregate([
    { $match: { schoolId: schoolObjectId, paymentDate: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: "$paymentDate" }, year: { $year: "$paymentDate" } },
        amount: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const expenseTrend = await Expense.aggregate([
    { $match: { schoolId: schoolObjectId, date: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { month: { $month: "$date" }, year: { $year: "$date" } },
        amount: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return {
    totals: {
      income: totalIncome,
      expenses: totalExpenses,
      balance: totalIncome - totalExpenses,
      monthlyIncome,
      monthlyExpenses,
    },
    debtorsCount,
    trends: {
      incomeTrend,
      expenseTrend,
    },
  };
};

const getJournalEntries = async (schoolId, filters = {}) => {
  if (!schoolId) throw new Error("School ID is required");
  const schoolObjectId = new ObjectId(schoolId);

  const { startDate, endDate, type } = filters;

  const dateFilterPayments = {};
  const dateFilterExpenses = {};

  if (startDate) {
    const d = new Date(startDate);
    if (!isNaN(d)) {
      dateFilterPayments.$gte = d;
      dateFilterExpenses.$gte = d;
    }
  }

  if (endDate) {
    const d = new Date(endDate);
    if (!isNaN(d)) {
      dateFilterPayments.$lte = d;
      dateFilterExpenses.$lte = d;
    }
  }

  const paymentQuery = {
    schoolId: schoolObjectId,
    status: "SUCCESS",
  };
  if (Object.keys(dateFilterPayments).length) {
    paymentQuery.paymentDate = dateFilterPayments;
  }

  const expenseQuery = {
    schoolId: schoolObjectId,
  };
  if (Object.keys(dateFilterExpenses).length) {
    expenseQuery.date = dateFilterExpenses;
  }

  const [payments, expenses] = await Promise.all([
    Payment.find(paymentQuery)
      .populate("studentId", "firstName lastName matricule")
      .populate({
        path: "studentFeeId",
        populate: { path: "feeDefinitionId", select: "name category" },
      })
      .lean(),
    Expense.find(expenseQuery).lean(),
  ]);

  let entries = [];

  if (!type || type === "INCOME") {
    const incomeEntries = payments.map((p) => {
      const feeDef = p.studentFeeId?.feeDefinitionId;
      const student = p.studentId;

      return {
        id: p._id,
        date: p.paymentDate,
        type: "INCOME",
        amount: p.amount,
        currency: feeDef?.currency || "USD",
        category: feeDef?.category || "TUITION",
        description:
          p.note ||
          (feeDef ? `Paiement - ${feeDef.name}` : "Paiement frais scolaire"),
        method: p.method,
        reference: p.reference,
        student: student
          ? {
              id: student._id,
              name: `${student.firstName} ${student.lastName}`,
              matricule: student.matricule,
            }
          : null,
        meta: {
          paymentId: p._id,
          studentFeeId: p.studentFeeId?._id,
        },
      };
    });
    entries = entries.concat(incomeEntries);
  }

  if (!type || type === "EXPENSE") {
    const expenseEntries = expenses.map((e) => ({
      id: e._id,
      date: e.date,
      type: "EXPENSE",
      amount: e.amount,
      currency: e.currency || "USD",
      category: e.category,
      description: e.description,
      method: null,
      reference: null,
      student: null,
      meta: {
        expenseId: e._id,
        recordedBy: e.recordedBy,
      },
    }));
    entries = entries.concat(expenseEntries);
  }

  entries.sort((a, b) => new Date(b.date) - new Date(a.date));

  return entries;
};

module.exports = {
  getFinanceDashboardStats,
  getJournalEntries,
};
