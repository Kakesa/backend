// role.middleware.js

const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Vérification si l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    // Vérifier si req.user.role existe et est une chaîne
    const userRole = req.user.role ? String(req.user.role).trim().toLowerCase() : '';
    
    // Gérer le cas où roles est passé comme un seul tableau [array] au lieu de ...array
    let normalizedRoles;
    if (roles.length === 1 && Array.isArray(roles[0])) {
      // Cas: restrictTo(['admin', 'teacher']) - un seul argument qui est un tableau
      normalizedRoles = roles[0].map(role => String(role).trim().toLowerCase());
    } else {
      // Cas: restrictTo('admin', 'teacher') - arguments séparés
      normalizedRoles = roles.map(role => String(role).trim().toLowerCase());
    }

    // Vérification des rôles autorisés
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: 'Accès refusé (droits insuffisants)',
        details: {
          userRole: req.user.role,
          requiredRoles: roles
        }
      });
    }

    next();
  };
};

module.exports = restrictTo; // Export direct, PAS { restrictTo }
