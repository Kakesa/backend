const feeService = require('../modules/fees/fee.service');

/**
 * Scheduled job to send automatic fee reminders
 * This should be called by a cron job scheduler
 * Run this job daily at 9:00 AM
 */
const runFeeReminderJob = async () => {
    try {
        console.log('🔄 Starting automatic fee reminder job...');
        
        const stats = await feeService.sendAutomaticReminders();
        
        console.log('✅ Fee reminder job completed:', {
            upcoming: stats.upcoming,
            overdue: stats.overdue,
            total: stats.total
        });
        
        return stats;
    } catch (error) {
        console.error('❌ Error in fee reminder job:', error);
        throw error;
    }
};

module.exports = {
    runFeeReminderJob
};
