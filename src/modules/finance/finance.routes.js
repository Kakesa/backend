const express = require("express");
const router = express.Router();
const financeController = require("./finance.controller");
const restrictTo = require("../../middlewares/role.middleware");

// Les routes sont déjà protégées par 'protect' dans src/routes.js
router.use(restrictTo("admin", "accountant", "superadmin"));

router.get("/dashboard", financeController.getDashboardStats);

module.exports = router;
