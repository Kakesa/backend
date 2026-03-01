const messageService = require("./message.service");

const getMessagesByUser = async (req, res, next) => {
  try {
    const data = await messageService.getMessagesByUser(req.params.userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getInbox = async (req, res, next) => {
  try {
    const data = await messageService.getInbox(req.params.userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getSent = async (req, res, next) => {
  try {
    const data = await messageService.getSent(req.params.userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const count = await messageService.getUnreadCount(req.params.userId);
    res.status(200).json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const data = await messageService.sendMessage(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const data = await messageService.markAsRead(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await messageService.markAllAsRead(req.params.userId);
    res.status(200).json({ success: true, message: "Tous les messages ont été marqués comme lus" });
  } catch (err) {
    next(err);
  }
};

const archiveMessage = async (req, res, next) => {
  try {
    const data = await messageService.archiveMessage(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    await messageService.deleteMessage(req.params.id);
    res.status(200).json({ success: true, message: "Message supprimé" });
  } catch (err) {
    next(err);
  }
};

const getContacts = async (req, res, next) => {
  try {
    const data = await messageService.getContacts(req.user._id, req.user.school);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getConversationHistory = async (req, res, next) => {
  try {
    const data = await messageService.getConversationHistory(req.user._id, req.params.otherId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const markConversationAsRead = async (req, res, next) => {
  try {
    await messageService.markConversationAsRead(req.user._id, req.params.otherId);
    res.status(200).json({ success: true, message: "Conversation marquée comme lue" });
  } catch (err) {
    next(err);
  }
};

const sendMessageToAllParents = async (req, res, next) => {
  try {
    const result = await messageService.sendMessageToAllParents(
      req.user._id,
      req.user.school,
      req.body
    );
    res.status(201).json({ 
      success: true, 
      message: `Message envoyé à ${result.sentTo} parent(s)`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const sendMessageToAllTeachers = async (req, res, next) => {
  try {
    const result = await messageService.sendMessageToAllTeachers(
      req.user._id,
      req.user.school,
      req.body
    );
    res.status(201).json({ 
      success: true, 
      message: `Message envoyé à ${result.sentTo} professeur(s)`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

const sendMessageToAllStudents = async (req, res, next) => {
  try {
    const result = await messageService.sendMessageToAllStudents(
      req.user._id,
      req.user.school,
      req.body
    );
    res.status(201).json({ 
      success: true, 
      message: `Message envoyé à ${result.sentTo} élève(s)`,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMessagesByUser,
  getInbox,
  getSent,
  getUnreadCount,
  sendMessage,
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
