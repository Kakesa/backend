const cron = require('node-cron');
const Subscription = require('../modules/subscriptions/subscription.model');
const School = require('../modules/schools/school.model');
const redis = require('../config/redis');

cron.schedule('0 0 * * *', async () => {
  console.log('⏰ Vérification des abonnements expirés...');
  const now = new Date();

  const expiredSubs = await Subscription.find({ endDate: { $lt: now }, status: 'active' });

  for (const sub of expiredSubs) {
    sub.status = 'expired';
    await sub.save();

    // Sync School.subscription
    await School.findByIdAndUpdate(sub.school, { subscription: sub._id });

    // Supprimer du cache Redis
    await redis.del(`school:${sub.school}:subscription`);

    console.log(`❌ Abonnement ${sub._id} expiré et mis à jour`);
  }
});
