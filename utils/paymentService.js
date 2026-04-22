const Razorpay = require('razorpay')


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

const paymentService = async (amt) => {
    const razorpayOrder = await razorpay.orders.create({
        amount: amt * 100, // Convert to paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    });
    return razorpayOrder
}

module.exports = paymentService