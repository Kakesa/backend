// modules/invitations/invitation.model.js
const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    role: {
      type: String,
      enum: ["teacher", "parent", "admin"],
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Invitation", invitationSchema);
