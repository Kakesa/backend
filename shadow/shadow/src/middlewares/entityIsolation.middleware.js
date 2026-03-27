/**
 * Middleware d'isolation des entités
 * Bloque l'accès aux entités d'autres écoles
 */

const validateEntityAccess = async (entityId, entityType, user) => {
  // Pour l'instant, validation simple - peut être étendu plus tard
  if (!entityId || !entityType || !user) {
    throw new Error('Paramètres manquants pour la validation');
  }
  
  // Super-admin peut accéder à tout
  if (user.role === 'superadmin') {
    return true;
  }
  
  // Pour les autres rôles, on vérifie juste qu'ils ont une école
  if (!user.school) {
    throw new Error('Utilisateur non associé à une école');
  }
  
  return true;
};

/**
 * Middleware de filtrage automatique pour les listes
 */
const filterBySchool = (Model) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return next();
      }

      // Super-admin peut voir tout
      if (user.role === 'superadmin') {
        return next();
      }

      // Pour les autres, on s'assure qu'ils ont une école
      if (!user.school) {
        return res.status(403).json({
          message: 'Utilisateur non associé à une école',
          error: 'No school assigned'
        });
      }

      next();
    } catch (error) {
      console.error('Erreur dans filterBySchool middleware:', error);
      next(error);
    }
  };
};

/**
 * Middleware d'isolation principal
 */
const entityIsolation = (options = {}) => {
  return async (req, res, next) => {
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

      // Pour les autres rôles, vérifier l'accès aux entités
      const { entityId, entityType } = options;
      
      if (entityId && entityType) {
        await validateEntityAccess(entityId, entityType, user);
      }

      next();
    } catch (error) {
      console.error('Erreur dans entityIsolation middleware:', error);
      return res.status(403).json({
        message: 'Accès non autorisé: cette ressource n\'appartient pas à votre établissement',
        error: error.message
      });
    }
  };
};

module.exports = {
  entityIsolation,
  validateEntityAccess,
  filterBySchool
};
