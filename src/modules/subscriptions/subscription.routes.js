const express = require('express');
const controller = require('./subscription.controller');

const router = express.Router();

router.post('/', controller.createOrUpdateSubscription);
router.get('/school/:schoolId', controller.getSchoolSubscription);
router.get('/stats/global', controller.getGlobalSubscriptionStats);

module.exports = router;
