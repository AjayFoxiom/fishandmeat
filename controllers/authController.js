const prisma = require('../config/db')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const sendResponse = require('../utils/sendResponse')


exports.registerUser = catchAsync(async (req, res, next) => {
    console.log("req--------------------",req.body);
    
    const { email, password, username, mobile, fcmToken } = req.body

    if (!email || !password || !username) {
        return next(new AppError('email, password and username are required', 400))
    }

    const existing = await prisma.users.findUnique({
        where: { email }
    })

    if (existing) {
        return next(new AppError('User already exists with this email', 409))
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.users.create({
        data: {
            username,
            email,
            password: hashedPassword,
            mobile: mobile || null,
            fcmToken: fcmToken || null
        }
    })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_PRIVATE_KEY)
    console.log("token ------------: ", token);
    console.log("user ------------: ", user);


    sendResponse(res, 201, true, 'User registered successfully', {
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            mobile: user.mobile
        }
    })
})


exports.loginUser = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    if (!email || !password) {
        return next(new AppError('email and password are required', 400))
    }

    const user = await prisma.users.findUnique({
        where: { email }
    })

    if (!user || !user.isActive) {
        return next(new AppError('Invalid email or password', 401))
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
        return next(new AppError('Invalid email or password', 401))
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_PRIVATE_KEY)

    sendResponse(res, 200, true, 'Login successful', {
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            mobile: user.mobile
        }
    })
})
