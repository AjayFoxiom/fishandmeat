const jwt = require('jsonwebtoken')

const jwtMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1]
        if (!token) {
           return res.status(400).json(`Invalid token`)
        }
        const val = jwt.verify(token, process.env.JWT_PRIVATE_KEY)
        req.payload = val.userId
        next()
    } catch (err) {
        console.log(err);
        res.status(404).json({
            message: 'error occur in jwt middleware',
            error: err
        })
    }
}

module.exports=jwtMiddleware