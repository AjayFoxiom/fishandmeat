const schedulePreorderReminder = require('./preorderReminder');
const scheduleOfferNotifications = require('./offerNotification');


const initCrons = () => {
    console.log('Initializing cron jobs...');
    schedulePreorderReminder();
    scheduleOfferNotifications();
};

module.exports = initCrons;