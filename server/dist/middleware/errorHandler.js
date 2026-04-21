"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(error, req, res, next) {
    console.error('❌ Error handler caught:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
}
