const express = require('express')
const cartController = require('../controllers/cartController')
const jwtMiddle = require('../middlewares/jwtMiddleware')

const router = express.Router()

router.post('/', jwtMiddle, cartController.addToCart)
router.get('/', jwtMiddle, cartController.getCartProducts)
router.delete('/:id', jwtMiddle, cartController.removeFromCart)
router.get('/:id/increase', jwtMiddle, cartController.increaseQuantity)
router.get('/:id/decrease', jwtMiddle, cartController.decreaseQuantity)

module.exports = router