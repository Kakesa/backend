const mongoose = require('mongoose');

const paymentPlanSchema = new mongoose.Schema({
    studentFeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudentFee',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    balance: {
        type: Number,
        required: true
    },
    installments: [{
        dueDate: {
            type: Date,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        description: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'PAID', 'OVERDUE'],
            default: 'PENDING'
        },
        paidDate: {
            type: Date
        }
    }],
    status: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
        default: 'ACTIVE'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt on save
paymentPlanSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Index for better performance
paymentPlanSchema.index({ studentFeeId: 1 });
paymentPlanSchema.index({ status: 1 });
paymentPlanSchema.index({ 'installments.dueDate': 1 });

module.exports = mongoose.model('PaymentPlan', paymentPlanSchema);
