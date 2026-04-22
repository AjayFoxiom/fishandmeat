const express = require('express')
const promocodeController = require('../controllers/promocodeController')
const jwtMiddle = require('../middlewares/jwtMiddleware')


const router = express.Router()

router.post('/', jwtMiddle, promocodeController.createPromocode)
router.get('/', jwtMiddle, promocodeController.getVendorPromocode)
router.put('/:id', jwtMiddle, promocodeController.editVendorPromocode)
router.post('/verify', jwtMiddle, promocodeController.applyPromocode)
router.delete('/:id',promocodeController.deleteVendorPromocode)


module.exports = router