const prisma = require('../config/db')
const sendResponse = require('../utils/sendResponse')
const catchAsync = require('../utils/catchAsync')

exports.getUserOrderHistory = catchAsync(async (req, res, next) => {
    const userId = req.payload
    const orderHistory = await prisma.orders.findMany({
        where: { userId }
    })
    sendResponse(res, 200, true, '', orderHistory)
})

exports.getUniqueOrder = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const order = await prisma.orders.findUnique({
        where: { id }
    })
    sendResponse(res, 200, true, '', order)
})
