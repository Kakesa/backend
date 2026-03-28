const Room = require("./room.model");

const createRoom = async (data) => {
  const room = new Room(data);
  return await room.save();
};

const getAllRooms = async (query = {}) => {
  const { schoolId } = query;
  const filter = {};
  if (schoolId) filter.schoolId = schoolId;
  return await Room.find(filter).sort({ name: 1 }).lean();
};

const getRoomById = async (id) => {
  const room = await Room.findById(id).lean();
  if (!room) throw { statusCode: 404, message: "Salle introuvable" };
  return room;
};

const updateRoom = async (id, data) => {
  const room = await Room.findByIdAndUpdate(id, data, { new: true });
  if (!room) throw { statusCode: 404, message: "Salle introuvable" };
  return room;
};

const deleteRoom = async (id) => {
  const result = await Room.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw { statusCode: 404, message: "Salle introuvable" };
  return true;
};

module.exports = {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
};
