const express = require('express')
const authController = require('../controllers/authController')

const router = express.Router()

router.post('/register', authController.registerUser)
router.post('/verify', authController.verifyOTP)
router.post('/resend', authController.resendOtp)
router.post('/login', authController.loginUser)

module.exports = router