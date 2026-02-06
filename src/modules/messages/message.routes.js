const express = require("express");
const router = express.Router();
const messageController = require("./message.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

router.get("/user/:userId", messageController.getMessagesByUser);
router.get("/inbox/:userId", messageController.getInbox);
router.get("/sent/:userId", messageController.getSent);
router.get("/unread-count/:userId", messageController.getUnreadCount);

router.post("/", messageController.sendMessage);
router.put("/:id/read", messageController.markAsRead);
router.put("/read-all/:userId", messageController.markAllAsRead);
router.put("/:id/archive", messageController.archiveMessage);
router.delete("/:id", messageController.deleteMessage);

module.exports = router;
