const Subscription = require('./subscription.model');
const School = require('../schools/school.model');
const redis = require('../../config/redis');


/* ===========================
   CREATE OR UPDATE
=========================== */
const upsertSubscription = async ({ schoolId, plan, durationMonths }) => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);

  const subscription = await Subscription.findOneAndUpdate(
    { school: schoolId },
    { status: 'active', plan, startDate, endDate },
    { new: true, upsert: true }
  );

  // 🔁 Sync direct dans School.subscription
  await School.findByIdAndUpdate(schoolId, { subscription: subscription._id });

  // 🔥 Update cache Redis
  await redis.set(`school:${schoolId}:subscription`, JSON.stringify(subscription), 'EX', 3600);

  return subscription;
};

/* ===========================
   GET BY SCHOOL
=========================== */
const getSubscriptionBySchool = async (schoolId) => {
  return Subscription.findOne({ school: schoolId }).lean();
};

/* ===========================
   GLOBAL STATS
=========================== */
const getGlobalSubscriptionStats = async () => {
  const stats = await Subscription.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    active: 0,
    expired: 0,
    pendingActivation: 0,
    trial: 0,
  };

  stats.forEach((s) => {
    if (s._id === 'pending_activation') {
      result.pendingActivation = s.count;
    } else {
      result[s._id] = s.count;
    }
  });

  return result;
};

module.exports = {
  upsertSubscription,
  getSubscriptionBySchool,
  getGlobalSubscriptionStats,
};
