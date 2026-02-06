const eventService = require("./event.service");

const getEvents = async (req, res, next) => {
  try {
    const data = await eventService.getEvents(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const data = await eventService.getEventById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getUpcomingEvents = async (req, res, next) => {
  try {
    const { schoolId } = req.query;
    const { days } = req.query;
    const data = await eventService.getUpcomingEvents(schoolId, days);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const data = await eventService.createEvent(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const data = await eventService.updateEvent(req.params.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    await eventService.deleteEvent(req.params.id);
    res.status(200).json({ success: true, message: "Événement supprimé" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEvents,
  getEventById,
  getUpcomingEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
