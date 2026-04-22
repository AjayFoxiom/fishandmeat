const express = require('express')
const vendorController = require('../controllers/vendorController')
const jwtMiddle = require('../middlewares/jwtMiddleware')

const router = express.Router()

router.post('/apply', jwtMiddle, vendorController.addVendorApplication)
router.get('/status', jwtMiddle, vendorController.getVendorApplicationStatus)
router.post('/offers', jwtMiddle, vendorController.addSpecialOfferNotification)
router.get('/offer/:id', jwtMiddle, vendorController.specialOfferNotificationStatus)
router.get('/offers', jwtMiddle, vendorController.getVendorNotificationHistory)

module.exports = router