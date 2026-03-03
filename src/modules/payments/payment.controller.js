const maishapayService = require('../../services/maishapay.service');
const { StudentFee, Payment } = require('../fees/fee.model');
const Student = require('../students/student.model');
const { createNotification } = require('../notifications/notification.service');
const mongoose = require('mongoose');

/**
 * Initiate a Mobile Money payment from a Parent
 */
const initiateMobilePayment = async (req, res, next) => {
    try {
        const { studentFeeId, amount, phoneNumber, provider } = req.body;

        const studentFee = await StudentFee.findById(studentFeeId).populate('feeDefinitionId');
        if (!studentFee) return res.status(404).json({ success: false, message: 'Frais introuvable' });

        if (amount > studentFee.balance) {
            return res.status(400).json({ success: false, message: 'Le montant dépasse le solde restant' });
        }

        const student = await Student.findById(studentFee.studentId);

        // Generate a unique reference
        const reference = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const callbackUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/webhook/maishapay`;

        const response = await maishapayService.initiateCollection({
            amount,
            currency: studentFee.feeDefinitionId.currency || 'USD',
            phoneNumber,
            provider,
            reference,
            callbackUrl,
            customerName: `${student.firstName} ${student.lastName}`
        });

        // Optionally save a "PENDING" Payment record here to track initiated payments
        await Payment.create({
            studentId: student._id,
            studentFeeId: studentFee._id,
            schoolId: studentFee.schoolId,
            amount,
            method: 'MOBILE_MONEY',
            reference,
            note: `Initiated via Mobile Money (${provider})`,
            status: 'PENDING' // Need to add 'status' to Payment model or use a distinct field
        });

        res.status(200).json({ success: true, data: response });
    } catch (err) {
        next(err);
    }
};

/**
 * Webhook for MaishaPay notifications
 */
const maishaPayWebhook = async (req, res, next) => {
    try {
        const payload = req.body;
        console.log('MaishaPay Webhook Received:', payload);

        // Validation logic depends on MaishaPay documentation for signature/verification
        // Assuming payload has transactionReference and status
        const { transactionReference, status, amount } = payload;

        if (status === 'SUCCESS' || status === 'COMPLETED' || payload.code === '200') {
            const payment = await Payment.findOne({ reference: transactionReference });
            if (payment && payment.status !== 'SUCCESS') {
                payment.status = 'SUCCESS';
                await payment.save();

                // Update StudentFee
                const studentFee = await StudentFee.findById(payment.studentFeeId);
                if (studentFee) {
                    studentFee.amountPaid += parseFloat(amount || payment.amount);
                    await studentFee.save();

                    // Notify User
                    const student = await Student.findById(studentFee.studentId).populate('userId');
                    if (student && student.userId) {
                        await createNotification({
                            userId: student.userId._id,
                            title: 'Paiement Confirmé',
                            message: `Votre paiement Mobile Money de ${amount} a été reçu avec succès.`,
                            type: 'success'
                        });
                    }
                }
            }
        }

        // Always respond 200 to webhook
        res.status(200).send('OK');
    } catch (err) {
        console.error('Webhook Error:', err.message);
        res.status(500).send('Webhook Error');
    }
};

module.exports = {
    initiateMobilePayment,
    maishaPayWebhook
};
