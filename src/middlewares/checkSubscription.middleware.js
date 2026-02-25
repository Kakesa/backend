const redis = require('../config/redis');
const School = require('../modules/schools/school.model');

module.exports = async (req, res, next) => {
  try {
    const schoolId = req.user?.school?._id;
    if (!schoolId) {
      return res.status(403).json({ message: 'Aucune école associée' });
    }

    // 🔥 Clé Redis
    const redisKey = `school:${schoolId}:subscription`;

    // 1️⃣ Essayer de récupérer depuis Redis
    let subscription = await redis.get(redisKey);
    if (subscription) {
      subscription = JSON.parse(subscription);
    } else {
      // 2️⃣ Sinon récupérer depuis MongoDB
      const school = await School.findById(schoolId).populate('subscription').lean();
      subscription = school.subscription;
      // 3️⃣ Stocker dans Redis 1h
      await redis.set(redisKey, JSON.stringify(subscription), 'EX', 3600);
    }

    // ❌ Vérification statut
    // On autorise 'active', 'trial' et 'free'. Un abonnement 'free' n'a pas forcément de date de fin.
    const allowedStatuses = ['active', 'trial', 'free'];
    if (!subscription || !allowedStatuses.includes(subscription.status)) {
      return res.status(403).json({ message: 'Abonnement expiré ou inactif' });
    }

    // Vérifier la date de fin seulement si elle existe (les plans 'free' peuvent ne pas en avoir)
    if (subscription.endDate && new Date(subscription.endDate) < new Date()) {
      return res.status(403).json({ message: 'Abonnement expiré' });
    }

    // 🟢 Tout est bon
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur vérification abonnement' });
  }
};
