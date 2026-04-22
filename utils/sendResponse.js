const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
    return res.status(statusCode).json({
        success,
        message,
          ...(data && { data }),
          ...(error && { error }),
    })
}

module.exports = sendResponse
