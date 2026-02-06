const express = require("express");
const router = express.Router();
const eventController = require("./event.controller");
const { protect } = require("../../middlewares/auth.middleware");

router.use(protect);

router.get("/events", eventController.getEvents);
router.get("/events/:id", eventController.getEventById);
router.get("/upcoming", eventController.getUpcomingEvents);
router.post("/events", eventController.createEvent);
router.put("/events/:id", eventController.updateEvent);
router.delete("/events/:id", eventController.deleteEvent);

module.exports = router;
