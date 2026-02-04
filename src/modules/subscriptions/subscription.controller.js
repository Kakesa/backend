const subscriptionService = require('./subscription.service');

/* ===========================
   CREATE / UPDATE
=========================== */
exports.createOrUpdateSubscription = async (req, res) => {
  const { schoolId, plan, durationMonths } = req.body;

  const subscription = await subscriptionService.upsertSubscription({
    schoolId,
    plan,
    durationMonths,
  });

  res.status(200).json(subscription);
};

/* ===========================
   GET BY SCHOOL
=========================== */
exports.getSchoolSubscription = async (req, res) => {
  const { schoolId } = req.params;

  const subscription = await subscriptionService.getSubscriptionBySchool(schoolId);

  res.status(200).json(subscription);
};

/* ===========================
   GLOBAL STATS
=========================== */
exports.getGlobalSubscriptionStats = async (_req, res) => {
  const stats = await subscriptionService.getGlobalSubscriptionStats();

  res.status(200).json(stats);
};
