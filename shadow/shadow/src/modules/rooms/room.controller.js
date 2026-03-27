const roomService = require("./room.service");

const getAllRooms = async (req, res, next) => {
  try {
    const data = await roomService.getAllRooms({ ...req.query, schoolId: req.schoolId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const data = await roomService.getRoomById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createRoom = async (req, res, next) => {
  try {
    const data = await roomService.createRoom({ ...req.body, schoolId: req.schoolId });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const data = await roomService.updateRoom(req.params.id, { ...req.body, schoolId: req.schoolId });
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    await roomService.deleteRoom(req.params.id);
    res.status(200).json({ success: true, message: "Salle supprimée avec succès" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};
