const Notification = require("./notification.model");

/* =====================================================
   CREATE NOTIFICATION
===================================================== */
const createNotification = async (data) => {
  const notification = new Notification(data);
  return await notification.save();
};

/* =====================================================
   GET NOTIFICATIONS BY USER
===================================================== */
const getNotificationsByUser = async (userId, unreadOnly = false) => {
  const filter = { userId };
  if (unreadOnly) filter.isRead = false;

  return await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
};

/* =====================================================
   MARK AS READ
===================================================== */
const markAsRead = async (id) => {
  return await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
};

/* =====================================================
   MARK ALL AS READ
===================================================== */
const markAllAsRead = async (userId) => {
  return await Notification.updateMany({ userId }, { isRead: true });
};

/* =====================================================
   DELETE NOTIFICATION
===================================================== */
const deleteNotification = async (id) => {
  return await Notification.deleteOne({ _id: id });
};

module.exports = {
  createNotification,
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
