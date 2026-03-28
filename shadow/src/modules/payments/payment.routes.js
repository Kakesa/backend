const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { protect } = require('../../middlewares/auth.middleware');

// Public webhook route (MaishaPay will POST here)
router.post('/webhook/maishapay', paymentController.maishaPayWebhook);

// Protected routes for parents
router.post('/initiate-mobile', protect, paymentController.initiateMobilePayment);
router.get('/history', protect, paymentController.getPaymentHistory);
router.get('/receipt/:paymentId', protect, paymentController.downloadPaymentReceipt);
router.post('/plans', protect, paymentController.createPaymentPlan);
router.get('/plans', protect, paymentController.getPaymentPlans);

module.exports = router;
