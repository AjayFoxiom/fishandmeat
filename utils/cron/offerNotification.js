const cron = require('node-cron')
const pushNotifications = require('../../services/pushNotifications')

const scheduleOfferNotifications = () => {
    cron.schedule("0 * * * *", async () => {
        // cron.schedule("* * * * *", async () => {
        console.log("Checking for new offer notifications...");
        pushNotifications.sendScheduledNotifications();
    });
};

module.exports = scheduleOfferNotifications;