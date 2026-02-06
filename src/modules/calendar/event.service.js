const Event = require("./event.model");

const createEvent = async (data) => {
  const event = new Event(data);
  return await event.save();
};

const getEvents = async (query = {}) => {
  const { schoolId, classId } = query;
  const filter = { schoolId };
  
  if (classId) {
    filter.$or = [{ classId: classId }, { classId: null }];
  }

  return await Event.find(filter).sort({ start: 1 }).lean();
};

const getUpcomingEvents = async (schoolId, days = 7) => {
  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + parseInt(days));

  return await Event.find({
    schoolId,
    start: { $gte: now, $lte: future }
  }).sort({ start: 1 }).lean();
};

const getEventById = async (id) => {
  return await Event.findById(id).lean();
};

const updateEvent = async (id, data) => {
  return await Event.findByIdAndUpdate(id, data, { new: true });
};

const deleteEvent = async (id) => {
  return await Event.deleteOne({ _id: id });
};

module.exports = {
  createEvent,
  getEvents,
  getUpcomingEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
