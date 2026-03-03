const express = require("express");
const router = express.Router();
const expenseController = require("./expense.controller");
const restrictTo = require("../../middlewares/role.middleware");

// Les routes sont déjà protégées par 'protect' dans src/routes.js
router.use(restrictTo("admin", "accountant", "superadmin"));

router.post("/", expenseController.createExpense);
router.get("/", expenseController.getAllExpenses);
router.get("/stats", expenseController.getExpenseStats);
router.get("/:id", expenseController.getExpenseById);
router.put("/:id", expenseController.updateExpense);
router.delete("/:id", expenseController.deleteExpense);

module.exports = router;
