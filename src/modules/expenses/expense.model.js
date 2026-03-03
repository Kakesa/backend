const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
    {
        description: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: "USD" },
        date: { type: Date, default: Date.now },
        category: {
            type: String,
            enum: ["SALARY", "UTILITIES", "EQUIPMENT", "MAINTENANCE", "SUPPLIES", "RENT", "TAXES", "OTHER"],
            default: "OTHER"
        },
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
        attachment: { type: String }, // URL of the proof (invoice/receipt)
        note: { type: String, trim: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
