const notificationService = require("./notification.service");

const getNotificationsByUser = async (req, res, next) => {
  try {
    const data = await notificationService.getNotificationsByUser(req.params.userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getUnreadNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getNotificationsByUser(req.params.userId, true);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createNotification = async (req, res, next) => {
  try {
    const data = await notificationService.createNotification(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const data = await notificationService.markAsRead(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.params.userId);
    res.status(200).json({ success: true, message: "Toutes les notifications marquées comme lues" });
  } catch (err) {
    next(err);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    await notificationService.deleteNotification(req.params.id);
    res.status(200).json({ success: true, message: "Notification supprimée" });
  } catch (err) {
    next(err);
  }
};

const notifyNewUserJoined = async (req, res, next) => {
  try {
    const data = await notificationService.notifyNewUserJoined(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotificationsByUser,
  getUnreadNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  notifyNewUserJoined,
};
