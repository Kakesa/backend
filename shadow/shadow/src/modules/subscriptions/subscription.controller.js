const mongoose = require('mongoose');
const subscriptionService = require('./subscription.service');

/* ===========================
   CREATE / UPDATE SUBSCRIPTION
=========================== */
const upsertSubscription = async (req, res, next) => {
  try {
    const { schoolId, plan, durationMonths } = req.body;

    if (!schoolId || !plan || !durationMonths) {
      return res.status(400).json({
        success: false,
        message: 'schoolId, plan et durationMonths requis',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        message: 'schoolId invalide',
      });
    }

    const subscription = await subscriptionService.upsertSubscription({
      schoolId,
      plan,
      durationMonths,
    });

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (err) {
    next(err);
  }
};

/* ===========================
   GET BY SCHOOL
=========================== */
const getBySchool = async (req, res, next) => {
  try {
    const { schoolId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        message: 'schoolId invalide',
      });
    }

    const subscription = await subscriptionService.getSubscriptionBySchool(
      schoolId
    );

    res.status(200).json({
      success: true,
      data: subscription,
    });
  } catch (err) {
    next(err);
  }
};

/* ===========================
   GLOBAL STATS
=========================== */
const getStats = async (req, res, next) => {
  try {
    const stats = await subscriptionService.getGlobalSubscriptionStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  upsertSubscription,
  getBySchool,
  getStats,
};
