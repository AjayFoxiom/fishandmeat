const prisma = require('../config/db')
const sendResponse = require('../utils/sendResponse')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')


exports.addVendorApplication = catchAsync(async (req, res, next) => {
    const userId = req.payload
    const { pan, aadhaar, shopname, gstNumber, location } = req.body
    console.log(req.body);
    
    
    if (!pan || !aadhaar || !shopname || !gstNumber || !location) {
        return next(new AppError(`Invalid data`, 404))
    }
    const existing = await prisma.vendor.findUnique({
        where: { userId }
    })
    if (existing) {
        return next(new AppError(`vendor already exsist`, 404))
    } else {
        const user = await prisma.users.update({
            where: { id: userId },
            data: { vendor: "pending" }
        })
        console.log(user);
        
        const newVendor = await prisma.vendor.create({
            data: { userId, pan, aadhaar, shopname, gstNumber, location, email: user.email, name: user.username, mobile: user.mobile }
        })
        console.log(newVendor);
        
       
        
        sendResponse(res, 201, true, `Application send successfully`,)
    }
})

exports.getVendorApplicationStatus = catchAsync(async (req, res, next) => {
    const userId = req.payload
    const application = await prisma.vendor.findUnique({
        where: { userId }
    })
    if (!application) { return next(new AppError(`Application not found`, 404)) }
    sendResponse(res, 200, true, `Application details retrived`, application)
})

exports.addSpecialOfferNotification = async (req, res, next) => {
    const userId = req.payload
    const { title, body, dateTime, productId } = req.body
    const vendor = await prisma.vendor.findUnique({
        where: { userId }
    })
    if (!vendor) { return next(new AppError(`vendor not found`, 404)) }

    await prisma.offerNotifications.create({
        data: { title, body, dateTime, productId, vendorId: vendor.id }
    })
    sendResponse(res, 201, true, `data added successfully wait for admins approval`,)
}

exports.specialOfferNotificationStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params
    const offer = await prisma.offerNotifications.findUnique({
        where: { id }
    })
    if (!offer) { return next(new AppError(`offer notification not found`, 404)) }
    sendResponse(res, 200, true, ``, offer)
})

exports.getVendorNotificationHistory = catchAsync(async (req, res, next) => {
    const userId = req.payload
    const vendor = await prisma.vendor.findUnique({
        where: { userId }
    })
    const notifications = await prisma.offerNotifications.findMany({
        where: { vendorId: vendor.id }
    })
    sendResponse(res, 200, true, '', notifications)
})
