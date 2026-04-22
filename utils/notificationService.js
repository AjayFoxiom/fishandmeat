// const admin = require('./firebase')


// const notificationService = async (title, body, token, data) => {
//     if (data) {
//         var message = {
//             notification: {
//                 title,
//                 body,
//             },
//             token,
//             data
//         };
//     } else {
//         var message = {
//             notification: {
//                 title,
//                 body,
//             },
//             token,
//         };
//     }

//     await admin.messaging().send(message);
//     console.log(`Notification sent `);
// }

// module.exports = notificationService

