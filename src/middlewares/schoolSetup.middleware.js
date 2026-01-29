module.exports = (req, res, next) => {
  // Superadmin et admin peuvent toujours passer
  if (['superadmin', 'admin'].includes(req.user.role)) {
    // Optionnel : forcer needsSchoolSetup à true pour ces rôles
    req.user.needsSchoolSetup = true;
    return next();
  }

  // Les autres utilisateurs bloqués si l'école est déjà configurée
  if (req.user.needsSchoolSetup === false) {
    return res.status(403).json({
      success: false,
      message: "Configuration de l'école déjà terminée",
    });
  }

  next();
};
