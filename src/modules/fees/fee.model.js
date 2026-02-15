const mongoose = require("mongoose");

/* =====================================================
   FEE DEFINITION SCHEMA
   (Ex: "Frais de Scolarité 2025-2026", "Cantine", etc.)
===================================================== */
const feeDefinitionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    category: { type: String, enum: ["TUITION", "TRANSPORT", "CANTEEN", "OTHER"], default: "TUITION" },
    dueDate: { type: Date }, // Optional global deadline
    academicYear: { type: String, required: true }, // e.g., "2025-2026"
    targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }], // If empty, applies to all
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "ARCHIVED"], default: "ACTIVE" },
  },
  { timestamps: true }
);

/* =====================================================
   STUDENT FEE SCHEMA
   (Le solde d'un élève spécifique pour un frais donné)
===================================================== */
const studentFeeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    feeDefinitionId: { type: mongoose.Schema.Types.ObjectId, ref: "FeeDefinition", required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    totalAmount: { type: Number, required: true }, // Copié de FeeDefinition au moment de l'attribution
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, required: true }, // totalAmount - amountPaid
    status: { 
      type: String, 
      enum: ["UNPAID", "PARTIAL", "PAID", "OVERDUE"], 
      default: "UNPAID" 
    },
    lastReminderDate: { type: Date },
  },
  { timestamps: true }
);

// Mettre à jour le solde avant la sauvegarde
studentFeeSchema.pre("save", function (next) {
  this.balance = this.totalAmount - this.amountPaid;
  if (this.amountPaid === 0) {
    this.status = "UNPAID";
  } else if (this.amountPaid < this.totalAmount) {
    this.status = "PARTIAL";
  } else {
    this.status = "PAID";
  }
  next();
});

/* =====================================================
   PAYMENT SCHEMA
   (Historique des transactions)
===================================================== */
const paymentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    studentFeeId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentFee", required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
    amount: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, default: Date.now },
    method: { 
      type: String, 
      enum: ["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CREDIT_CARD"], 
      default: "CASH" 
    },
    reference: { type: String, trim: true }, // Check #, Transaction ID, etc.
    note: { type: String, trim: true },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin who recorded it
  },
  { timestamps: true }
);

const FeeDefinition = mongoose.model("FeeDefinition", feeDefinitionSchema);
const StudentFee = mongoose.model("StudentFee", studentFeeSchema);
const Payment = mongoose.model("Payment", paymentSchema);

module.exports = { FeeDefinition, StudentFee, Payment };
