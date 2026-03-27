const express = require("express");
const router = express.Router();
const expenseController = require("./expense.controller");
const restrictTo = require("../../middlewares/role.middleware");

// Les routes sont déjà protégées par 'protect' dans src/routes.js
router.get("/", restrictTo("admin", "accountant", "superadmin"), expenseController.getAllExpenses);
router.get("/stats", restrictTo("admin", "accountant", "superadmin"), expenseController.getExpenseStats);
router.get("/:id", restrictTo("admin", "accountant", "superadmin"), expenseController.getExpenseById);

router.post("/", restrictTo("accountant", "superadmin"), expenseController.createExpense);
router.put("/:id", restrictTo("accountant", "superadmin"), expenseController.updateExpense);
router.delete("/:id", restrictTo("accountant", "superadmin"), expenseController.deleteExpense);

module.exports = router;
