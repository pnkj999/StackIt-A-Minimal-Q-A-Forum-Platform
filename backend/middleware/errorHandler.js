// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let error = {
        statusCode: 500,
        message: 'Internal Server Error',
        code: 'INTERNAL_ERROR'
    };

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        error.statusCode = 400;
        error.message = 'Validation Error';
        error.details = Object.values(err.errors).map(val => val.message);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.statusCode = 401;
        error.message = 'Invalid token';
        error.code = 'INVALID_TOKEN';
    }

    if (err.name === 'TokenExpiredError') {
        error.statusCode = 401;
        error.message = 'Token expired';
        error.code = 'TOKEN_EXPIRED';
    }

    // PostgreSQL errors
    if (err.code === '23505') { // Unique violation
        error.statusCode = 409;
        error.message = 'Resource already exists';
        error.code = 'DUPLICATE_RESOURCE';
    }

    if (err.code === '23503') { // Foreign key violation
        error.statusCode = 400;
        error.message = 'Referenced resource does not exist';
        error.code = 'INVALID_REFERENCE';
    }

    // Custom application errors
    if (err.statusCode) {
        error = err;
    }

    res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
