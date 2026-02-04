const Subscription = require('./subscription.model');

/* ===========================
   CREATE OR UPDATE
=========================== */
const upsertSubscription = async ({ schoolId, plan, durationMonths }) => {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);

  return Subscription.findOneAndUpdate(
    { school: schoolId },
    {
      status: 'active',
      plan,
      startDate,
      endDate,
    },
    { new: true, upsert: true }
  );
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
