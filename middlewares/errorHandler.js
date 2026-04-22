
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    console.error('Error:', err);

    // Show detailed errors in development 
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message || 'Internal Server Error',
            stack: err.stack,
            error: err
        });
    }

    // In production, show minimal info
    res.status(err.statusCode).json({
        status: err.status,
        message: err.isOperational ? err.message : 'Something went wrong!'
    });
};

module.exports = errorHandler;
