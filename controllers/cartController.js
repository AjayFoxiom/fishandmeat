const prisma = require('../config/db')
const catchAsync = require('../utils/catchAsync')
const sendResponse = require('../utils/sendResponse')
const AppError = require('../utils/AppError')


exports.addToCart = catchAsync(async (req, res, next) => {
    const userId = req.payload
    const { productId, title, offerPrice, description, price, image, stock, reviews, availability, category } = req.body

    const existing = await prisma.cart.findFirst({
        where: { userId, productId }
    })
    if (existing) {
        const increaseQuantity = await prisma.cart.update({
            where: { id: existing.id },
            data: { quantity: { increment: 1 } }
        })
        sendResponse(res, 200, true, "Quantity Updated", increaseQuantity)
    } else {
        const cartProduct = await prisma.cart.create({
            data: { productId, quantity: 1, title, description, stock: Number(stock), price, image, reviews, availability, category, userId, offerPrice }
        })
        sendResponse(res, 201, true, 'product added to cart', cartProduct)
    }
})

exports.getCartProducts = catchAsync(async (req, res, next) => {
    const userId = req.payload
    const product = await prisma.cart.findMany({
        where: { userId }
    })
    sendResponse(res, 200, true, '', product)
})

exports.removeFromCart = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const item = await prisma.cart.delete({
        where: { id }
    })
    sendResponse(res, 200, true, 'item deleted', item)
})

exports.increaseQuantity = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const cartItem = await prisma.cart.update({
        where: { id },
        data: { quantity: { increment: 1 } }
    })
    sendResponse(res, 200, true, `Quantity Increased`, cartItem)
})

exports.decreaseQuantity = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const quantityCount = await prisma.cart.findUnique({
        where: { id }
    })
    if (!quantityCount) {
        return next(new AppError('Cart item not found', 404));
    }
    if (quantityCount.quantity <= 1) {
        await prisma.cart.delete({
            where: { id }
        })
        return sendResponse(res, 200, true, `item removed from cart`,)
    } else {
        const cartItem = await prisma.cart.update({
            where: { id },
            data: { quantity: { decrement: 1 } }
        })
        return sendResponse(res, 200, true, `Quantity Decreased`, cartItem)
    }
})

