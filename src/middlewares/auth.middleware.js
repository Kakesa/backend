const jwt = require('jsonwebtoken');
const User = require('../modules/users/users.model');
const Subscription = require('../modules/subscriptions/subscription.model'); // ⚠️ il manquait cet import

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Non autorisé (token manquant)' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur invalide' });
    }

    req.user = user; 
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

const checkSubscriptionActive = async (req, res, next) => {
  if (!req.user?.school) {
    return res.status(403).json({ message: "Utilisateur non rattaché à une école" });
  }

  const subscription = await Subscription.findOne({
    school: req.user.school,
    status: 'active',
    endDate: { $gte: new Date() },
  });

  if (!subscription) {
    return res.status(403).json({
      message: "Abonnement expiré ou inactif",
    });
  }

  next();
};

// ⚠️ Exporter les deux middlewares
module.exports = { protect, checkSubscriptionActive };
