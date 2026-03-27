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
    // Injecter l'ID de l'école depuis l'utilisateur connecté
    if (req.user && req.user.school) {
      req.body.schoolId = req.user.school;
    }
    
    // Injecter l'ID du créateur
    if (req.user && req.user._id) {
      req.body.createdBy = req.user._id;
    }
    
    // Valider et corriger le type si nécessaire
    const validTypes = ["exam", "holiday", "meeting", "other", "event", "conference", "workshop", "competition", "celebration"];
    if (req.body.type && !validTypes.includes(req.body.type)) {
      req.body.type = "other"; // Valeur par défaut si invalide
    }
    
    // S'assurer que les dates sont présentes
    if (!req.body.start || !req.body.end) {
      return res.status(400).json({
        success: false,
        message: "Les dates de début et de fin sont obligatoires",
        error: "MISSING_DATES"
      });
    }
    
    const data = await eventService.createEvent(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    // Gérer spécifiquement les erreurs de validation Mongoose
    if (err.name === "ValidationError") {
      const validationErrors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: "Erreur de validation des données",
        errors: validationErrors,
        error: "VALIDATION_ERROR"
      });
    }
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
