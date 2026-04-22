// const prisma=require('../config/db')
// const moment=require('moment')
// const notificationService=require('../utils/notificationService')
// const catchAsync = require('../utils/catchAsync')



// exports.checkUpcomingPreorders = catchAsync(async () => {
//     const tomorrowDate = moment().add(1, 'days').format('DD-MM-YYYY')

//     const preOrders = await prisma.orders.findMany({
//         where: {
//             preOrder: tomorrowDate
//         },
//     })
//     console.log(`Found ${preOrders.length} preorders for tomorrow`);

//     if (preOrders.length > 0) {

//         for (let i = 0; i < preOrders.length; i++) {

//             if (preOrders[i].userId) {
//                 const user = await prisma.users.findUnique({
//                     where: { id: preOrders[i].userId }
//                 })

//                 if (user.fcmToken) {
//                     let title = "Reminder: Your preorder is coming!"
//                     let body = `Your preorder (#${preOrders[i].id}) will be delivered tomorrow.`
//                     let token = user.fcmToken
//                     notificationService(title, body, token);

//                 } else {
//                     console.log(`fcmToken not found`);
//                 }
//             } else {
//                 console.log(`user not found`);
//             }
//         }
//     } else {
//         console.log(`No pre-orders for tomorrow`);
//     }
// })

// exports.sendScheduledNotifications = catchAsync(async () => {
//     // const current = moment().format('DD-MM-YYYY:HH.mm');
//     const current = moment().format('DD-MM-YYYY:HH')
//     const notifications = await prisma.offerNotifications.findMany({
//         where: { status: "success", dateTime: current }
//     })
//     if (notifications.length === 0) {
//         console.log('No scheduled notifications at this time.');
//         return;
//     }
//     for (let i = 0; i < notifications.length; i++) {
//         const users = await prisma.users.findMany({
//             // select: { fcmToken: true },
//             where: { fcmToken: { not: null } }
//         });
//         if (users.length === 0) {
//             console.log(`no users found`);
//             return;
//         }
//         var token;
//         var title;
//         var body;
//         var data;
//         for (let j = 0; j < users.length; j++) {
//             if (users[j].fcmToken) {
//                 token = users[j].fcmToken
//                 title = notifications[i].title
//                 body = notifications[i].body
//                 data = { productId: notifications[i].productId }
//                 notificationService(title, body, token, data)
//             } else {
//                 console.log(`user not have fcm token`);
//             }
//         }
//     }
// })

