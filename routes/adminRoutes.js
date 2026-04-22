const express = require('express')
const adminController = require("../controllers/adminController")

const router = express.Router()

router.get('/vendors/applications', adminController.getVendorApplications)
router.get('/vendors/application/:id', adminController.getUniqeVendorApplication)
router.put('/vendors/:id/verify', adminController.verifyVendorApplication)
router.get('/vendors', adminController.getVendorList)
router.get('/vendor/:id', adminController.getOneVendor)

router.get('/users', adminController.getUsersList)
router.get('/user/:id', adminController.getOneUser)
router.put('/users/activate/:id', adminController.activateAccount)
router.put('/users/deactivate/:id', adminController.deactivateAccount)

router.get('/analytics/sales-report', adminController.getSalesReport)
router.post('/analytics/top-product', adminController.topSellingProduct)
router.post('/analytics/top-vendor', adminController.topRevenueGeneratingVendor)


router.get('/notifications/requests', adminController.getOfferNotificationRequest)
router.get('/notifications/requests/:id', adminController.getUniqueOfferNotificationRequest)
router.put('/notifications/requests/:id', adminController.verifyVendorNotificationRequest)

router.get('/products', adminController.getAllProductList)
router.get('/product/:id', adminController.getUniqueProduct)
router.delete('/product/:id', adminController.removeProduct)

router.post('/orders',adminController.getAllOrders)

module.exports = router