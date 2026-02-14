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

/* =====================================================
   NOTIFY NEW USER JOINED
===================================================== */
const notifyNewUserJoined = async (data) => {
  const School = require("../schools/school.model");
  const school = await School.findById(data.schoolId);
  if (!school) throw new Error("École introuvable");

  // Créer une notification pour l'admin de l'école
  const notification = new Notification({
    userId: school.admin,
    title: "Nouvelle inscription",
    message: `${data.userName} (${data.userRole}) vient de rejoindre votre établissement : ${data.schoolName}.`,
    type: "info",
    link: `/dashboard/users/${data.userId}`,
  });

  return await notification.save();
};

module.exports = {
  createNotification,
  getNotificationsByUser,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  notifyNewUserJoined,
};
