module.exports = (req, res, next) => {
  // Superadmin voit tout
  if (req.user.role === "superadmin") {
    return next();
  }

  if (!req.user.school) {
    return res.status(403).json({
      success: false,
      message: "Aucune école associée",
    });
  }

  // Injecte schoolId dans la requête
  req.schoolId = req.user.school;
  next();
};
