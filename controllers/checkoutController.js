const prisma = require('../config/db')
const paymentService = require('../utils/paymentService')
const generateInvoicePDF = require('../utils/invoiceService')
const sendInvoiceEmail = require('../utils/emailService')
const sendResponse = require('../utils/sendResponse')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const moment = require('moment')


exports.checkoutCart = catchAsync(async (req, res, next) => {
    const { discountAmount, address, pincode, preOrder } = req.body
    const userId = req.payload

    const cartItems = await prisma.cart.findMany({ where: { userId } });
    if (cartItems.length === 0) {
        return next(new AppError(`Cart is empty`, 404))
    }
    const totalAmount = cartItems.reduce((prev, item) => prev + item.price * item.quantity, 0);
    // Create Razorpay order
    const razorpayOrder = await paymentService(discountAmount);
    if (preOrder) {

        const isoString = moment(preOrder, "DD/MM/YYYY").toISOString();
        const actualDate = isoString.split("T")[0];

        var newOrder = await prisma.orders.create({
            data: {
                preOrder: actualDate, userId, amount: totalAmount, discountAmount, status: "PENDING", address, pincode, items: cartItems, razorpayOrderId: razorpayOrder.id
            }
        })
    } else {
        var newOrder = await prisma.orders.create({
            data: {
                userId, amount: totalAmount, discountAmount, status: "PENDING", address, pincode, items: cartItems, razorpayOrderId: razorpayOrder.id
            }
        })
    }
    sendResponse(res, 201, true, `order added successfully`, newOrder)
})

exports.confirmPayment = catchAsync(async (req, res, next) => {
    const { orderId, paymentId, status } = req.body;
    //orderId= rayzorpayid
    const updatedOrder = await prisma.orders.update({
        where: { razorpayOrderId: orderId },
        data: { status, paymentId },
    });
    const user = await prisma.users.findUnique({
        where: { id: updatedOrder.userId }
    })
    const userId = req.payload
    if (status === "PAID") {
        const pdfPath = await generateInvoicePDF(updatedOrder, user);
        const emailSub = `Invoice for Your Order #${updatedOrder.id}`
        const emailData = `Hello ${user.username}, please find your invoice for Order #${updatedOrder.id} attached.`
        const orderId = updatedOrder.id
        await sendInvoiceEmail(user.email, emailSub, emailData, orderId, pdfPath);
        const checkoutProducts = await prisma.cart.findMany({ where: { userId } });

        for (let i = 0; i < checkoutProducts.length; i++) {
            const product = await prisma.products.findUnique({
                where: { id: checkoutProducts[i].productId }
            })
            if (product) {
                const newStock = product.stock - checkoutProducts[i].quantity

                await prisma.products.update({
                    where: { id: checkoutProducts[i].productId },
                    data: { stock: newStock }
                })
            } else {
                console.log(`no products`);
            }
        }

        await prisma.cart.deleteMany({ where: { userId: updatedOrder.userId } });
    }
    sendResponse(res, 200, true, `payment conformed`, updatedOrder)
})

