const prisma = require('../config/db')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const sendResponse = require('../utils/sendResponse')

// users
exports.getUsersList = catchAsync(async (req, res, next) => {
    const users = await prisma.users.findMany({
        where: {
            vendor: "false",
            // ...(search && {
            //     OR: [
            //         { username: { contains: search, mode: "insensitive" } },
            //         { email: { contains: search, mode: "insensitive" } }
            //     ]
            // })
        }
    })
    sendResponse(res, 200, true, ``, users)
})


exports.getOneUser = catchAsync(async (req, res, next) => {
    const { id } = req.params
    if (!id) { return next(new AppError('invalid inputs ', 404)) }
    const user = await prisma.users.findUnique({
        where: { id, isActive: true }
    })
    sendResponse(res, 200, true, '', user)
})

exports.activateAccount = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const { role } = req.body
    if (role == 'user') {
        const user = await prisma.users.update({
            where: { id, vendor: false },
            data: { isActive: true }
        })
        return sendResponse(res, 200, true, ``, user)
    } else if (role == 'vendor') {
        const vendor = await prisma.vendor.update({
            where: { id },
            data: { isActive: true }
        })
        return sendResponse(res, 200, true, ``, vendor)
    }
    else {
        return next(new AppError(`not found`, 404))
    }

}
)


exports.deactivateAccount = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const { role } = req.body
    if (role == 'user') {
        const user = await prisma.users.update({
            where: { id, vendor: "false" },
            data: { isActive: false }
        })
        return sendResponse(res, 200, true, ``, user)
    } else if (role == 'vendor') {
        const vendor = await prisma.vendor.update({
            where: { id },
            data: { isActive: false }
        })
        return sendResponse(res, 200, true, ``, vendor)
    }
    else {
        return next(new AppError(`not found`, 404))
    }
})

//vendor

exports.getVendorApplications = catchAsync(async (req, res, next) => {
    const data = await prisma.vendor.findMany({
        where: { status: "pending" }
    })
    sendResponse(res, 200, true, ``, data)
})


exports.getUniqeVendorApplication = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const application = await prisma.vendor.findUnique({
        where: { id }
    })
    sendResponse(res, 200, true, ``, application)
})

exports.verifyVendorApplication = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const { status } = req.body
    if (!status) { return next(new AppError(`status required`, 400)) }

    const application = await prisma.vendor.update({
        where: { id },
        data: { status }
    })
    await prisma.users.update({
        where: { id: application.userId },
        data: { vendor: "true" }
    })
    sendResponse(res, 200, true, `Application status updated`)
})

exports.getVendorList = catchAsync(async (req, res, next) => {
    // const { search } = req.query;
    const vendors = await prisma.vendor.findMany({
        where: {
            status: "success",
            // ...(search && {
            //     OR: [
            //         { name: { contains: search, mode: "insensitive" } },
            //         { email: { contains: search, mode: "insensitive" } }
            //     ]
            // })
        }
    })
    sendResponse(res, 200, true, ``, vendors)
})

exports.getOneVendor = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const vendor = await prisma.vendor.findUnique({
        where: { id }
    })
    sendResponse(res, 200, true, ``, vendor)
})

//Analytics

exports.getSalesReport = catchAsync(async (req, res, next) => {
    const orders = await prisma.orders.findMany({
        select: { discountAmount: true }
    })
    const totalRevenue = orders.reduce((prev, next) => prev + next.discountAmount, 0)
    const totalOrders = orders.length
    sendResponse(res, 200, true, ``, { totalRevenue, totalOrders })
})

exports.topSellingProduct = catchAsync(async (req, res, next) => {
    const { period } = req.body;
    const startDate = new Date();
    if (period === "week") {
        startDate.setDate(startDate.getDate() - 7); // Last 7 days
    } else if (period === "month") {
        startDate.setMonth(startDate.getMonth() - 1); // Last 30 days
    } else {
        return next(new AppError(`Invalid period. Use week or month`, 404))
    }

    const allOrders = await prisma.orders.findMany({
        where: {
            date: {
                gte: startDate
            },
        }
    })
    if (!allOrders) {
        return next(new AppError(`No orders placed in this time period`, 404))
    }
    var products = []
    const addProduct = allOrders.map((i) => {
        products.push(i.items)
    })

    const productDetails = []
    for (let i = 0; i < products.length; i++) {
        for (let j = 0; j < products[i].length; j++) {
            productDetails.push({ productId: products[i][j].productId, quantity: products[i][j].quantity })
        }
    }
    const salesSummary = productDetails.reduce((acc, { productId, quantity }) => {
        acc[productId] = (acc[productId] || 0) + quantity;
        return acc;
    }, {});

    const topProducts = Object.entries(salesSummary)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([productId, quantity]) => ({ productId, quantity }));

    const topProductDetails = [];
    for (let i = 0; i < topProducts.length; i++) {
        var product = await prisma.products.findUnique({
            where: { id: topProducts[i].productId }
        })
        topProductDetails.push(product)
    }
    sendResponse(res, 200, true, ``, topProductDetails)

})

exports.topRevenueGeneratingVendor = catchAsync(async (req, res, next) => {
    const { period } = req.body;

    const startDate = new Date();
    if (period === "week") {
        startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
        startDate.setMonth(startDate.getMonth() - 1);
    } else {
        return next(new AppError(`Invalid period. Use week or month`, 404))
    }

    const allOrders = await prisma.orders.findMany({
        where: {
            date: {
                gte: startDate
            },
        }
    })

    var orderedProducts = [];
    allOrders.map((i) => {
        orderedProducts.push(i.items)
    })

    var orderDetails = []
    for (let i = 0; i < orderedProducts.length; i++) {
        for (let j = 0; j < orderedProducts[i].length; j++) {
            orderDetails.push({ productId: orderedProducts[i][j].productId, quantity: orderedProducts[i][j].quantity })
        }
    }
    var groupedProducts = {};
    orderDetails.forEach(({ productId, quantity }) => {
        if (!groupedProducts[productId]) {
            groupedProducts[productId] = 0;
        }
        groupedProducts[productId] += quantity;
    });
    const finalGroupedProducts = Object.entries(groupedProducts).map(([productId, quantity]) => ({
        productId,
        quantity
    }));

    var userRevenueDetails = []
    await Promise.all(finalGroupedProducts.map(async (i) => {
        var product = await prisma.products.findUnique({
            where: {
                id: i.productId
            }
        })
        userRevenueDetails.push({ vendorId: product.userId, productId: i.productId, quantity: i.quantity, price: product.price, totalPrice: product.price * i.quantity })
    }))

    const topVendorDetails = userRevenueDetails.reduce((max, product) => (product.totalPrice > max.totalPrice ? product : max), userRevenueDetails[0]);

    const topRevenueGeneratingVendor = await prisma.vendor.findUnique({
        where: {
            userId: topVendorDetails.vendorId
        }
    })
    sendResponse(res, 200, true, ``, { vendor: topRevenueGeneratingVendor, profit: topVendorDetails.totalPrice, quantity: topVendorDetails.quantity })
})


//notification
exports.getOfferNotificationRequest = catchAsync(async (req, res, next) => {
    const notifications = await prisma.offerNotifications.findMany({
        where: { status: "pending" }
    })
    sendResponse(res, 200, true, ``, notifications)
})

exports.getUniqueOfferNotificationRequest = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const notifications = await prisma.offerNotifications.findUnique({
        where: { id }
    })
    sendResponse(res, 200, true, ``, notifications)
})

exports.verifyVendorNotificationRequest = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const { status } = req.body
    const notification = await prisma.offerNotifications.update({
        where: { id },
        data: { status }
    })
    sendResponse(res, 200, true, ``, notification)
}
)

//products
exports.getAllProductList = catchAsync(async (req, res, next) => {
    const allProducts = await prisma.products.findMany()
    sendResponse(res, 200, true, '', allProducts)
})


exports.getUniqueProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const product = await prisma.products.findUnique({
        where: { id }
    })
    sendResponse(res, 200, true, '', product)
})

exports.removeProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const product = await prisma.products.delete({
        where: { id }
    })
    sendResponse(res, 200, true, 'product deleted', product)
})

exports.getAllOrders = catchAsync(async (req, res, next) => {
    const { period } = req.body
    const startDate = new Date();
    if (period === "week") {
        startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
        startDate.setMonth(startDate.getMonth() - 1);
    } else {
        return next(new AppError(`Invalid period. Use week or month`, 404))
    }
    const orders = await prisma.orders.findMany({
        where: {
            date: {
                gte: startDate
            },
        }
    })
    sendResponse(res, 200, true, "", orders)
})












