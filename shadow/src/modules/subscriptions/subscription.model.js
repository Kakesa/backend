const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ['active', 'expired', 'pending_activation', 'trial'],
      default: 'trial',
    },

    plan: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free',
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    price: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: ['mobile_money', 'bank_transfer', 'cash', null],
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
