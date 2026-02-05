// src/middlewares/subscription.middleware.js

/* ================================
   CHECK ADMIN ROLE
================================ */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Non authentifié" });
  }

  const allowedRoles = ['admin', 'superadmin'];

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: "Accès refusé : droits administrateur requis",
    });
  }

  next();
};

/* ================================
   CHECK ACTIVE SUBSCRIPTION
================================ */
const requireActiveSubscription = (req, res, next) => {
  const subscription = req.user?.school?.subscription;

  if (!subscription) {
    return res.status(403).json({
      message: "Aucun abonnement trouvé",
    });
  }

  if (subscription.status !== 'active') {
    return res.status(403).json({
      message: "Abonnement inactif ou expiré",
    });
  }

  if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
    return res.status(403).json({
      message: "Abonnement expiré",
    });
  }

  next();
};

module.exports = {
  requireAdmin,
  requireActiveSubscription,
};
