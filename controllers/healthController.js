const prisma = require('../config/db')
const os = require('os')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatUptime = (seconds) => {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return `${d}d ${h}h ${m}m ${s}s`
}

const bytesToMB = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB'

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/health
 * Lightweight liveness probe – no DB call, responds instantly.
 */
const healthCheck = (req, res) => {
    res.status(200).json({
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: formatUptime(process.uptime()),
        memory: {
            heapUsed: bytesToMB(process.memoryUsage().heapUsed),
            heapTotal: bytesToMB(process.memoryUsage().heapTotal),
            rss: bytesToMB(process.memoryUsage().rss),
        },
        system: {
            platform: os.platform(),
            nodeVersion: process.version,
            cpus: os.cpus().length,
            freeMemory: bytesToMB(os.freemem()),
            totalMemory: bytesToMB(os.totalmem()),
        },
    })
}

/**
 * GET /api/health/deep
 * Readiness probe – verifies database connectivity before reporting healthy.
 */
const deepHealthCheck = async (req, res) => {
    const startTime = Date.now()
    const checks = {}

    // ── Database ──────────────────────────────────────────────────────────────
    try {
        // A lightweight Prisma command that hits the DB without reading data
        await prisma.$runCommandRaw({ ping: 1 })
        checks.database = {
            status: 'ok',
            responseTime: `${Date.now() - startTime}ms`,
        }
    } catch (err) {
        checks.database = {
            status: 'error',
            message: err.message,
        }
    }

    // ── Environment variables ─────────────────────────────────────────────────
    const requiredEnvVars = [
        'DATABASE_URL',
        'JWT_PRIVATE_KEY',
        'EMAIL_ID',
        'EMAIL_PASS',
        'TWILIO_ACCOUNT_SID',
        'TWILIO_AUTH_TOKEN',
        'TWILIO_PHONE_NUMBER',
        'RAZORPAY_KEY_ID',
        'RAZORPAY_KEY_SECRET',
        'STRIPE_SECRET_KEY',
    ]

    const missingVars = requiredEnvVars.filter((key) => !process.env[key])

    checks.environment = {
        status: missingVars.length === 0 ? 'ok' : 'warning',
        ...(missingVars.length > 0 && { missingVariables: missingVars }),
    }

    // ── Overall status ────────────────────────────────────────────────────────
    const allOk = Object.values(checks).every((c) => c.status === 'ok')
    const hasError = Object.values(checks).some((c) => c.status === 'error')

    const overallStatus = hasError ? 'degraded' : allOk ? 'ok' : 'warning'
    const httpStatus = hasError ? 503 : 200

    res.status(httpStatus).json({
        status: overallStatus,
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: formatUptime(process.uptime()),
        responseTime: `${Date.now() - startTime}ms`,
        checks,
    })
}

module.exports = { healthCheck, deepHealthCheck }
