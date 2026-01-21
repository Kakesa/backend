module.exports = (req, res, next) => {
  if (req.user.needsSchoolSetup === false) {
    return res.status(403).json({
      success: false,
      message: "Configuration de l'école déjà terminée",
    });
  }
  next();
};
