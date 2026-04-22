const express = require('express')
const orderController = require('../controllers/orderController')
const jwtMiddle = require('../middlewares/jwtMiddleware')

const router = express.Router()

router.get('/', jwtMiddle, orderController.getUserOrderHistory)
router.get('/:id', jwtMiddle, orderController.getUniqueOrder)


module.exports = router