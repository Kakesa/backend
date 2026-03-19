/**
 * Middleware simple pour filtrer par école
 * Ajoute automatiquement schoolId aux requêtes
 */

const schoolFilter = (req, res, next) => {
  try {
    // Si c'est une route publique, passer au middleware suivant
    if (req.path.includes('/auth/') || 
        req.path.includes('/public/') || 
        req.path.includes('/health')) {
      return next();
    }

    const user = req.user;
    
    if (!user) {
      return next();
    }

    // Super-admin peut voir toutes les écoles
    if (user.role === 'superadmin') {
      return next();
    }

    // Pour les autres rôles, ajouter le filtre par école
    if (user.school) {
      // Ajouter schoolId aux query params pour GET
      if (req.query && !req.query.schoolId) {
        req.query.schoolId = user.school;
      }

      // Ajouter schoolId au body pour POST/PUT
      if (req.body && !req.body.schoolId) {
        req.body.schoolId = user.school;
      }
    }

    next();
  } catch (error) {
    console.error('Erreur dans schoolFilter middleware:', error);
    next();
  }
};

module.exports = schoolFilter;
