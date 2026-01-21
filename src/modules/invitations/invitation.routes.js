// modules/invitations/invitation.routes.js
const router = require("express").Router();
const { inviteUser } = require("./invitation.controller");
const { protect } = require("../../middlewares/auth.middleware");
const { restrictTo } = require("../../middlewares/role.middleware");

router.post("/", protect, restrictTo("admin"), inviteUser);

module.exports = router;
