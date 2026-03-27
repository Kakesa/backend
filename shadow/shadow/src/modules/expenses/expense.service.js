const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Expense = require("./expense.model");

const createExpense = async (data) => {
    const expense = await Expense.create(data);
    const populated = await Expense.findById(expense._id).populate("recordedBy", "name").lean();
    return {
        ...populated,
        recordedByName: populated.recordedBy?.name ?? "—",
    };
};

const getAllExpenses = async (schoolId, query = {}) => {
    const { category, startDate, endDate } = query;
    const filter = { schoolId };

    if (category) filter.category = category;
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter)
        .populate("recordedBy", "name")
        .sort({ date: -1 })
        .lean();
    return expenses.map((e) => ({
        ...e,
        recordedByName: e.recordedBy?.name ?? "—",
    }));
};

const getExpenseById = async (id) => {
    const expense = await Expense.findById(id).populate("recordedBy", "name").lean();
    if (!expense) return null;
    return {
        ...expense,
        recordedByName: expense.recordedBy?.name ?? "—",
    };
};

const updateExpense = async (id, data) => {
    const expense = await Expense.findByIdAndUpdate(id, data, { new: true })
        .populate("recordedBy", "name")
        .lean();
    if (!expense) return null;
    return {
        ...expense,
        recordedByName: expense.recordedBy?.name ?? "—",
    };
};

const deleteExpense = async (id) => {
    return await Expense.findByIdAndDelete(id);
};

const getExpenseStats = async (schoolId) => {
    const stats = await Expense.aggregate([
        { $match: { schoolId: new ObjectId(schoolId) } },
        {
            $group: {
                _id: "$category",
                totalAmount: { $sum: "$amount" },
                count: { $sum: 1 },
            },
        },
    ]);
    return stats;
};

module.exports = {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    getExpenseStats,
};
