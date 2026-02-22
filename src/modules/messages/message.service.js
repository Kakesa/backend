const Message = require("./message.model");
const User = require("../users/users.model");

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
    .populate("senderId", "name email role")
    .populate("recipientId", "name email role")
    .sort({ createdAt: -1 })
    .lean();
};

/* =====================================================
   GET INBOX
===================================================== */
const getInbox = async (userId) => {
  return await Message.find({ recipientId: userId, isArchived: false })
    .populate("senderId", "name email role")
    .sort({ createdAt: -1 })
    .lean();
};

/* =====================================================
   GET SENT
===================================================== */
const getSent = async (userId) => {
  return await Message.find({ senderId: userId })
    .populate("recipientId", "name email role")
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

/* =====================================================
   GET CONTACTS (users contactables)
===================================================== */
const getContacts = async (currentUserId, schoolId) => {
  const filter = {
    _id: { $ne: currentUserId },
    role: { $in: ["admin", "teacher", "parent"] },
    isActive: true,
  };
  if (schoolId) filter.school = schoolId;

  const users = await User.find(filter)
    .select("name email role")
    .sort({ role: 1, name: 1 })
    .lean();

  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
  }));
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
  getContacts,
};
