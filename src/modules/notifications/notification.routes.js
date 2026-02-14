const express = require("express");
const router = express.Router();
const notificationController = require("./notification.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

router.get("/user/:userId", notificationController.getNotificationsByUser);
router.get("/unread/:userId", notificationController.getUnreadNotifications);

router.post("/", notificationController.createNotification);
router.post("/user-joined", notificationController.notifyNewUserJoined);
router.put("/:id/read", notificationController.markAsRead);
router.put("/read-all/:userId", notificationController.markAllAsRead);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
