const express = require('express')
const productController = require('../controllers/productController')
const multerMiddle = require('../middlewares/multerMiddleware')
const jwtMiddle = require('../middlewares/jwtMiddleware')


const router = express.Router()

router.get('/', jwtMiddle, productController.getAllProducts)
router.get('/user', jwtMiddle, productController.getUserPosts)
router.get('/:id', jwtMiddle, productController.getUniqueProduct)
router.post('/', jwtMiddle, multerMiddle.single('image'), productController.addProduct)
router.put('/:id', jwtMiddle, multerMiddle.single('image'), productController.updateUserProducts)
router.delete('/:id', jwtMiddle, productController.deleteProduct)
router.put('/:id/review', jwtMiddle, productController.addProductReview)

module.exports = router