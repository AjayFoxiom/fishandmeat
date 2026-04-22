const prisma = require('../config/db')
const AppError = require('../utils/AppError')
const sendResponse = require('../utils/sendResponse')
const catchAsync = require('../utils/catchAsync')

exports.updateUserProfile = catchAsync(async (req, res,next) => {
    const { address, pincode, fcmToken } = req.body
    if(!address && !pincode && !fcmToken){
       return next(new AppError(`Invalid data`,404))
    }
    const userId = req.payload
    const user = await prisma.users.update({
        where: { id: userId },
        data: { address, pincode, fcmToken }
    })
    sendResponse(res,200,true,`user profile updated`,user)
})

exports.getUserDetails =catchAsync(async (req,res,next) => {
    const userId = req.payload
    const user = await prisma.users.findUnique({
        where: { id: userId }
    })
    if(!user){return next(new AppError('user not found',404))}
    sendResponse(res,200,true,`user details retrived`,user)
}) 
