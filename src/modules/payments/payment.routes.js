const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { protect } = require('../../middlewares/auth.middleware');

// Public webhook route (MaishaPay will POST here)
router.post('/webhook/maishapay', paymentController.maishaPayWebhook);

// Protected routes for parents
router.post('/initiate-mobile', protect, paymentController.initiateMobilePayment);

module.exports = router;
