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
};
