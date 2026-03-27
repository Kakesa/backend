const maishapayService = require('../../services/maishapay.service');
const { StudentFee, Payment } = require('../fees/fee.model');
const Student = require('../students/student.model');
const { createNotification } = require('../notifications/notification.service');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

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

/**
 * Get payment history for a student or specific fee
 */
const getPaymentHistory = async (req, res, next) => {
    try {
        const { studentId, studentFeeId } = req.query;
        const parentId = req.user._id;
        
        // Build query
        const query = {};
        if (studentFeeId) {
            query.studentFeeId = studentFeeId;
        } else if (studentId) {
            query.studentId = studentId;
        } else {
            // If parent, get all their children's payments
            const parent = await mongoose.model('Parent').findById(parentId).populate('childrenIds');
            if (parent && parent.childrenIds) {
                query.studentId = { $in: parent.childrenIds };
            }
        }

        const payments = await Payment.find(query)
            .populate('studentId', 'firstName lastName matricule')
            .populate('studentFeeId', 'feeDefinitionId')
            .sort({ paymentDate: -1 });

        res.status(200).json({ success: true, data: payments });
    } catch (err) {
        next(err);
    }
};

/**
 * Generate and download payment receipt PDF
 */
const downloadPaymentReceipt = async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        
        const payment = await Payment.findById(paymentId)
            .populate('studentId', 'firstName lastName matricule class')
            .populate('studentFeeId', 'feeDefinitionId totalAmount balance');

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Paiement introuvable' });
        }

        // Generate PDF
        const doc = new PDFDocument({ margin: 50 });
        const filename = `recu-paiement-${payment._id}.pdf`;
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe PDF to response
        doc.pipe(res);

        // PDF Content
        doc.fontSize(20).text('REÇU DE PAIEMENT', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12).text(`Numéro: ${payment._id}`);
        doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString('fr-FR')}`);
        doc.text(`Méthode: ${payment.method}`);
        doc.text(`Référence: ${payment.reference || '-'}`);
        doc.moveDown();

        doc.fontSize(14).text('Détails de l\'élève:', { underline: true });
        doc.fontSize(12);
        doc.text(`Nom: ${payment.studentId.firstName} ${payment.studentId.lastName}`);
        doc.text(`Matricule: ${payment.studentId.matricule || '-'}`);
        doc.text(`Classe: ${payment.studentId.class || '-'}`);
        doc.moveDown();

        doc.fontSize(14).text('Détails du paiement:', { underline: true });
        doc.fontSize(12);
        doc.text(`Frais: ${payment.studentFeeId.feeDefinitionId?.name || '-'}`);
        doc.text(`Montant payé: ${payment.amount} $`);
        doc.text(`Total frais: ${payment.studentFeeId.totalAmount} $`);
        doc.text(`Solde restant: ${payment.studentFeeId.balance} $`);
        
        if (payment.note) {
            doc.moveDown();
            doc.text(`Note: ${payment.note}`);
        }

        doc.moveDown(2);
        doc.fontSize(10).text('Ce reçu est généré automatiquement et valide comme preuve de paiement.', { align: 'center' });

        doc.end();
    } catch (err) {
        next(err);
    }
};

/**
 * Create a payment plan (installments)
 */
const createPaymentPlan = async (req, res, next) => {
    try {
        const { studentFeeId, installments } = req.body;
        const parentId = req.user._id;

        // Validate student fee belongs to parent's child
        const studentFee = await StudentFee.findById(studentFeeId)
            .populate('studentId')
            .populate('feeDefinitionId');

        if (!studentFee) {
            return res.status(404).json({ success: false, message: 'Frais introuvable' });
        }

        // Check if parent has access to this student
        const parent = await mongoose.model('Parent').findById(parentId);
        if (!parent.childrenIds.includes(studentFee.studentId._id.toString())) {
            return res.status(403).json({ success: false, message: 'Accès non autorisé' });
        }

        // Validate installments total matches balance
        const totalInstallments = installments.reduce((sum, inst) => sum + inst.amount, 0);
        if (Math.abs(totalInstallments - studentFee.balance) > 0.01) {
            return res.status(400).json({ 
                success: false, 
                message: 'Le total des échéances doit correspondre au solde dû' 
            });
        }

        // Create payment plan
        const paymentPlan = {
            studentFeeId,
            totalAmount: studentFee.balance,
            paidAmount: 0,
            balance: studentFee.balance,
            installments: installments.map(inst => ({
                ...inst,
                status: 'PENDING',
                dueDate: new Date(inst.dueDate)
            })),
            status: 'ACTIVE',
            createdAt: new Date(),
            createdBy: parentId
        };

        const savedPlan = await mongoose.model('PaymentPlan').create(paymentPlan);

        res.status(201).json({ success: true, data: savedPlan });
    } catch (err) {
        next(err);
    }
};

/**
 * Get payment plans for a student
 */
const getPaymentPlans = async (req, res, next) => {
    try {
        const { studentId } = req.query;
        const parentId = req.user._id;

        let query = {};
        
        if (studentId) {
            query.studentId = studentId;
        } else {
            // Get all parent's children's payment plans
            const parent = await mongoose.model('Parent').findById(parentId).populate('childrenIds');
            if (parent && parent.childrenIds) {
                query.studentId = { $in: parent.childrenIds };
            }
        }

        const plans = await mongoose.model('PaymentPlan').find(query)
            .populate('studentId', 'firstName lastName')
            .populate('studentFeeId', 'feeDefinitionId')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: plans });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    initiateMobilePayment,
    maishaPayWebhook,
    getPaymentHistory,
    downloadPaymentReceipt,
    createPaymentPlan,
    getPaymentPlans
};
