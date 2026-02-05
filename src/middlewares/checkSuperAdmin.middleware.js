module.exports = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      message: 'Accès réservé au super administrateur',
    });
  }

  next();
};
