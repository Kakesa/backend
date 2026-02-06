const express = require("express");
const router = express.Router();
const roomController = require("./room.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

router.get("/", roomController.getAllRooms);
router.get("/:id", roomController.getRoomById);
router.post("/", roomController.createRoom);
router.put("/:id", roomController.updateRoom);
router.delete("/:id", roomController.deleteRoom);

module.exports = router;
