const expenseService = require("./expense.service");

const createExpense = async (req, res, next) => {
    try {
        const schoolId = req.user.school || req.user.schoolId;
        const data = {
            ...req.body,
            schoolId,
            recordedBy: req.user._id || req.user.id,
        };
        const expense = await expenseService.createExpense(data);
        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
};

const getAllExpenses = async (req, res, next) => {
    try {
        const schoolId = req.user.school || req.user.schoolId;
        const expenses = await expenseService.getAllExpenses(schoolId, req.query);
        res.json({ success: true, data: expenses });
    } catch (error) {
        next(error);
    }
};

const getExpenseById = async (req, res, next) => {
    try {
        const expense = await expenseService.getExpenseById(req.params.id);
        if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
        res.json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
};

const updateExpense = async (req, res, next) => {
    try {
        const expense = await expenseService.updateExpense(req.params.id, req.body);
        if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
        res.json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
};

const deleteExpense = async (req, res, next) => {
    try {
        const expense = await expenseService.deleteExpense(req.params.id);
        if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });
        res.json({ success: true, message: "Expense deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const getExpenseStats = async (req, res, next) => {
    try {
        const schoolId = req.user.school || req.user.schoolId;
        const stats = await expenseService.getExpenseStats(schoolId);
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    getExpenseStats,
};
