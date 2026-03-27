// modules/invitations/invitation.service.js
const crypto = require("crypto");
const Invitation = require("./invitation.model");

const createInvitation = async ({ email, role, school }) => {
  const token = crypto.randomBytes(32).toString("hex");

  return Invitation.create({
    email,
    role,
    school,
    token,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24, // 24h
  });
};

module.exports = { createInvitation };
