import { env } from '../config/env.js';
import { sendError } from '../utils/response.js';

export const notFoundHandler = (req, res) => {
  return sendError(res, 404, `API route not found: ${req.method} ${req.originalUrl}`);
};

export const errorHandler = (err, req, res, next) => {
  // Log unexpected errors
  if (env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return sendError(res, 409, `An account with that ${field} already exists.`, {
      [field]: `This ${field} is already registered.`,
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, 400, `Invalid resource identifier: ${err.value}`);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
    return sendError(res, 400, 'Validation failed', errors);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Authentication token expired');
  }

  // Generic internal server error
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'An internal server error occurred. Please try again later.';
  
  const responseData = env.NODE_ENV === 'development' ? { stack: err.stack } : null;
  return sendError(res, statusCode, message, responseData);
};
