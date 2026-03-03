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
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalIncome = incomeAgg[0]?.total || 0;

    // 2. Monthly Income
    const monthlyIncomeAgg = await Payment.aggregate([
        { $match: { schoolId: schoolObjectId, paymentDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const monthlyIncome = monthlyIncomeAgg[0]?.total || 0;

    // 3. Total Expenses
    const expenseAgg = await Expense.aggregate([
        { $match: { schoolId: schoolObjectId } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalExpenses = expenseAgg[0]?.total || 0;

    // 4. Monthly Expenses
    const monthlyExpenseAgg = await Expense.aggregate([
        { $match: { schoolId: schoolObjectId, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const monthlyExpenses = monthlyExpenseAgg[0]?.total || 0;

    // 5. Debtors Count
    const debtorsCount = await StudentFee.countDocuments({
        schoolId: schoolObjectId,
        status: { $in: ["UNPAID", "PARTIAL"] }
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
                amount: { $sum: "$amount" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const expenseTrend = await Expense.aggregate([
        { $match: { schoolId: schoolObjectId, date: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { month: { $month: "$date" }, year: { $year: "$date" } },
                amount: { $sum: "$amount" }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
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
            expenseTrend
        }
    };
};

module.exports = {
    getFinanceDashboardStats,
};
