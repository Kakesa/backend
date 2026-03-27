// modules/invitations/invitation.controller.js
const { createInvitation } = require("./invitation.service");

const inviteUser = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    const invitation = await createInvitation({
      email,
      role,
      school: req.user.school,
    });

    res.status(201).json({
      success: true,
      message: "Invitation envoyée",
      token: invitation.token, // ⚠️ à envoyer par email en prod
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { inviteUser };
