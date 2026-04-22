const prisma = require('../config/db')
const jwt = require('jsonwebtoken');
const generateOTP = require('../utils/otpGenerating')
const emailService = require('../utils/emailService')
const smsService = require('../utils/smsService')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const sendResponse = require('../utils/sendResponse')


exports.registerUser = catchAsync(async (req, res, next) => {
    const { email, mobile, username, fcmToken } = req.body
    const exsisting = await prisma.users.findUnique({
        where: { email, mobile }
    })
    const subject = `Your OTP Code`
    if (exsisting) {
        const newOtp = generateOTP()
        const newOtpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 min
        const data = `Your OTP for registration is ${newOtp}. It will expire in 5 minutes.`
        await emailService(email, subject, data)
        // await smsService(mobile, data)
        await prisma.users.update({
            where: { email, mobile },
            data: { otp: newOtp, otpExpiry: newOtpExpiry }
        })
        sendResponse(res, 200, true, `User already exist , otp send successfully`,)
    } else {
        const otp = generateOTP()
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 min
        const data = `Your OTP for registration is ${otp}. It will expire in 5 minutes.`
        await emailService(email, subject, data)
        // await smsService(mobile, data)
        await prisma.users.create({
            data: { username, mobile, email, otp, otpExpiry, fcmToken }
        })
        sendResponse(res, 201, true, `OTP send successfully`)
    }
})

exports.verifyOTP = catchAsync(async (req, res, next) => {
    const { email, mobile, otp } = req.body
    if(!email && !mobile && !otp){
        return next(new AppError(`Invalid data`, 404))
    }
    const user = await prisma.users.findFirst({
        where: {
            OR: [
                email ? { email } : {},
                mobile ? { mobile } : {}
            ]
        }
    });
    
    if (!user || user.otp != otp) {
        return next(new AppError(`Invalid OTP`, 404))
    }

    if (Date.now() > user.otpExpiry) {
        return next(new AppError(`OTP expired. Please request a new one`, 404))
    }

    //jwt
    const val = jwt.sign({ userId: user.id }, process.env.JWT_PRIVATE_KEY)

    await prisma.users.update({
        where: { id: user.id },
        data: { otp: null, otpExpiry: null }
    })
    sendResponse(res, 200, true, `OTP verified successfully`, { token: val, username: user.username })
})

exports.resendOtp = catchAsync(async (req, res, next) => {
    const { email, mobile } = req.body
    const user = await prisma.users.findFirst({
        where: {
            OR: [
                email ? { email } : {},
                mobile ? { mobile } : {}
            ]
        }
    });
    
    if (!user) {
        return next(new AppError(`User not found`, 404))
    }
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 min 
    const subject = `Your OTP Code`
    const data = `Your OTP for registration is ${otp}. It will expire in 5 minutes.`
    await emailService(user.email, subject, data)
    // await smsService(user.mobile, data)

    await prisma.users.update({
        where: { email: user.email, mobile: user.mobile },
        data: { otp, otpExpiry }
    })
    sendResponse(res, 200, true, `OTP Resended successfully`,)
}
)

exports.loginUser = catchAsync(async (req, res, next) => {
    const { email, mobile } = req.body
    const user = await prisma.users.findFirst({
        where: {
            isActive: true,
            OR: [
                email ? { email } : {},  // Check if email exists
                mobile ? { mobile } : {} // Check if mobile exists
            ]
        }
    });

    if (!user) {
        return next(new AppError(`Invalid Email or Mobile`, 404))
    }
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 min 
    const subject = `Your OTP Code`
    const data = `Your OTP for registration is ${otp}. It will expire in 5 minutes.`
    await emailService(user.email, subject, data)
    // await smsService(user.mobile, data)
    await prisma.users.update({
        where: { email: user.email, mobile: user.mobile },
        data: { otp, otpExpiry }
    })
    sendResponse(res, 200, true, `otp send successfully`,)
})
