const express = require('express')
const checkoutController = require('../controllers/checkoutController')
const jwtMiddle = require('../middlewares/jwtMiddleware')


const router = express.Router()

router.post('/', jwtMiddle, checkoutController.checkoutCart)
router.post('/comfirm-payment', jwtMiddle, checkoutController.confirmPayment)



module.exports = router