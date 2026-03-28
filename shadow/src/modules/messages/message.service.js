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

  // Get unread counts for each contact
  const unreadCounts = await Message.aggregate([
    { $match: { recipientId: currentUserId, isRead: false } },
    { $group: { _id: "$senderId", count: { $sum: 1 } } }
  ]);

  const countMap = unreadCounts.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    unreadCount: countMap[u._id.toString()] || 0,
  }));
};

const getConversationHistory = async (userId, otherId) => {
  return await Message.find({
    $or: [
      { senderId: userId, recipientId: otherId },
      { senderId: otherId, recipientId: userId }
    ]
  })
    .populate("senderId", "name email role")
    .populate("recipientId", "name email role")
    .sort({ createdAt: 1 }) // Chronological order for chat
    .lean();
};

const markConversationAsRead = async (userId, otherId) => {
  return await Message.updateMany(
    { senderId: otherId, recipientId: userId, isRead: false },
    { isRead: true }
  );
};

/* =====================================================
   SEND MESSAGE TO ALL PARENTS (Admin only)
===================================================== */
const sendMessageToAllParents = async (senderId, schoolId, { subject, content }) => {
  // Get all active parents from the school
  const parents = await User.find({
    role: "parent",
    school: schoolId,
    isActive: true
  }).select("_id");

  if (parents.length === 0) {
    throw new Error("Aucun parent trouvé dans cette école");
  }

  // Create message for each parent
  const messages = parents.map((parent) => ({
    senderId,
    recipientId: parent._id,
    subject,
    content
  }));

  // Insert all messages in bulk
  const result = await Message.insertMany(messages);
  return {
    messageCount: result.length,
    sentTo: parents.length,
    messages: result
  };
};

/* =====================================================
   SEND MESSAGE TO ALL TEACHERS (Admin only)
===================================================== */
const sendMessageToAllTeachers = async (senderId, schoolId, { subject, content }) => {
  // Get all active teachers from the school
  const teachers = await User.find({
    role: "teacher",
    school: schoolId,
    isActive: true
  }).select("_id");

  if (teachers.length === 0) {
    throw new Error("Aucun professeur trouvé dans cette école");
  }

  // Create message for each teacher
  const messages = teachers.map((teacher) => ({
    senderId,
    recipientId: teacher._id,
    subject,
    content
  }));

  // Insert all messages in bulk
  const result = await Message.insertMany(messages);
  return {
    messageCount: result.length,
    sentTo: teachers.length,
    messages: result
  };
};

/* =====================================================
   SEND MESSAGE TO ALL STUDENTS (Admin only)
===================================================== */
const sendMessageToAllStudents = async (senderId, schoolId, { subject, content }) => {
  // Get all active students from the school
  const students = await User.find({
    role: "student",
    school: schoolId,
    isActive: true
  }).select("_id");

  if (students.length === 0) {
    throw new Error("Aucun élève trouvé dans cette école");
  }

  // Create message for each student
  const messages = students.map((student) => ({
    senderId,
    recipientId: student._id,
    subject,
    content
  }));

  // Insert all messages in bulk
  const result = await Message.insertMany(messages);
  return {
    messageCount: result.length,
    sentTo: students.length,
    messages: result
  };
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
  getConversationHistory,
  markConversationAsRead,
  sendMessageToAllParents,
  sendMessageToAllTeachers,
  sendMessageToAllStudents,
};
