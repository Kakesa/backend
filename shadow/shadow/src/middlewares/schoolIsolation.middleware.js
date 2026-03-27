/**
 * Middleware d'isolation multi-tenant
 * Injecte automatiquement le schoolId dans toutes les requêtes
 * sauf pour les super-admins
 */

const User = require('../users/users.model');

const schoolIsolation = async (req, res, next) => {
  try {
    // Si c'est une route publique, passer au middleware suivant
    if (req.path.includes('/auth/') || 
        req.path.includes('/public/') || 
        req.path.includes('/health')) {
      return next();
    }

    // Récupérer l'utilisateur depuis le token JWT
    const user = req.user;
    
    if (!user) {
      return next();
    }

    // Super-admin peut voir toutes les écoles
    if (user.role === 'superadmin') {
      return next();
    }

    // Pour les autres rôles, injecter le schoolId
    if (user.school) {
      // Ajouter schoolId dans les query params pour GET
      if (!req.query.schoolId) {
        req.query.schoolId = user.school;
      }

      // Ajouter schoolId dans le body pour POST/PUT
      if (req.body && !req.body.schoolId) {
        req.body.schoolId = user.school;
      }

      // Ajouter schoolId dans les params pour les routes paramétrées
      if (req.params && !req.params.schoolId) {
        req.params.schoolId = user.school;
      }
    }

    next();
  } catch (error) {
    console.error('Erreur dans schoolIsolation middleware:', error);
    next();
  }
};

module.exports = schoolIsolation;
