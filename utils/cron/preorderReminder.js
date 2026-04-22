const cron = require('node-cron')
const pushNotifications = require('../../services/pushNotifications')


const schedulePreorderReminder = () => {
    cron.schedule("00 11 * * *", async () => {
        console.log(" Running daily preorder check at 11:00 AM...");
        pushNotifications.checkUpcomingPreorders();
    });
};

module.exports = schedulePreorderReminder