// role.middleware.js

const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Vérification si l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    // Vérification des rôles autorisés
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé (droits insuffisants)' });
    }

    next();
  };
};

module.exports = restrictTo; // Export direct, PAS { restrictTo }
