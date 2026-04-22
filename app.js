require('dotenv').config()
const express = require('express')
const cors = require('cors')
const errorHandler = require('./middlewares/errorHandler')
const AppError = require('./utils/AppError')
const initCrons = require('./utils/cron/cron')
const morganLogger = require('./middlewares/morganLogger')

const productRoutes = require('./routes/productRoutes')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const orderRoutes = require('./routes/orderRoutes')
const cartRoutes = require('./routes/cartRoutes')
const promocodeRoutes = require('./routes/promocodeRoutes')
const vendorRouter = require('./routes/vendorRoutes')
const adminRouter = require('./routes/adminRoutes')
const checkoutRouter = require('./routes/checkoutRoutes')
const healthRouter = require('./routes/healthRoutes')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('./uploads'))

app.use(morganLogger)

app.use('/api/products', productRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/carts', cartRoutes)
app.use('/api/promocodes', promocodeRoutes)
app.use('/api/vendor', vendorRouter)
app.use('/api/admin', adminRouter)
app.use('/api/checkouts', checkoutRouter)
app.use('/api/health', healthRouter)


app.get("/", (req, res) => {
    res.send("<h1>server is live</h1>")
})

app.all('*', (req, res, next) => {
    return next(new AppError(`Can't find ${req.originalUrl}`, 400))
}
)

app.use(errorHandler)

module.exports = app
