const Message = require("./message.model");

/* =====================================================
   SEND MESSAGE
===================================================== */
const sendMessage = async (data) => {
  const message = new Message(data);
  return await message.save();
};

/* =====================================================
   GET MESSAGES BY USER (ALL)
===================================================== */
const getMessagesByUser = async (userId) => {
  return await Message.find({
    $or: [{ senderId: userId }, { recipientId: userId }]
  })
    .populate("senderId", "firstName lastName email")
    .populate("recipientId", "firstName lastName email")
    .sort({ createdAt: -1 })
    .lean();
};

/* =====================================================
   GET INBOX
===================================================== */
const getInbox = async (userId) => {
  return await Message.find({ recipientId: userId, isArchived: false })
    .populate("senderId", "firstName lastName email")
    .sort({ createdAt: -1 })
    .lean();
};

/* =====================================================
   GET SENT
===================================================== */
const getSent = async (userId) => {
  return await Message.find({ senderId: userId })
    .populate("recipientId", "firstName lastName email")
    .sort({ createdAt: -1 })
    .lean();
};

/* =====================================================
   GET UNREAD COUNT
===================================================== */
const getUnreadCount = async (userId) => {
  return await Message.countDocuments({ recipientId: userId, isRead: false });
};

/* =====================================================
   MARK AS READ
===================================================== */
const markAsRead = async (id) => {
  return await Message.findByIdAndUpdate(id, { isRead: true }, { new: true });
};

/* =====================================================
   MARK ALL AS READ
===================================================== */
const markAllAsRead = async (userId) => {
  return await Message.updateMany({ recipientId: userId }, { isRead: true });
};

/* =====================================================
   ARCHIVE MESSAGE
===================================================== */
const archiveMessage = async (id) => {
  return await Message.findByIdAndUpdate(id, { isArchived: true }, { new: true });
};

/* =====================================================
   DELETE MESSAGE
===================================================== */
const deleteMessage = async (id) => {
  return await Message.deleteOne({ _id: id });
};

module.exports = {
  sendMessage,
  getMessagesByUser,
  getInbox,
  getSent,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  archiveMessage,
  deleteMessage,
};
