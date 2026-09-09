'use strict';

function errorHandler(error, req, res, next) {
    console.error('Unhandled error:', error);

    if (res.headersSent) {
        return next(error);
    }

    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? 'An unexpected error occurred' : error.message,
        errorCode: error.errorCode || 'INTERNAL_ERROR'
    });
}

function notFoundHandler(req, res) {
    return res.status(404).json({
        success: false,
        message: 'Route not found',
        errorCode: 'NOT_FOUND'
    });
}

module.exports = {
    errorHandler,
    notFoundHandler
};
