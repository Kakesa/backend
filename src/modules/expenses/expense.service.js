const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Expense = require("./expense.model");

const createExpense = async (data) => {
    return await Expense.create(data);
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

    return await Expense.find(filter)
        .populate("recordedBy", "firstName lastName")
        .sort({ date: -1 })
        .lean();
};

const getExpenseById = async (id) => {
    return await Expense.findById(id).populate("recordedBy", "firstName lastName");
};

const updateExpense = async (id, data) => {
    return await Expense.findByIdAndUpdate(id, data, { new: true });
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
