const express = require('express')
const router = express.Router()
const { healthCheck, deepHealthCheck } = require('../controllers/healthController')

// GET /api/health          – lightweight liveness probe
router.get('/', healthCheck)

// GET /api/health/deep     – checks DB connectivity as well
router.get('/deep', deepHealthCheck)

module.exports = router
