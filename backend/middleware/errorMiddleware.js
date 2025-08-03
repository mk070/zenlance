import { logger, errorLogger } from '../utils/logger.js';

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode, status = 'error', isOperational = true, validationErrors = []) {
    super(message);
    this.statusCode = statusCode;
    this.status = status;
    this.isOperational = isOperational;
    this.validationErrors = validationErrors;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found middleware
export const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Global error handler
export const globalErrorHandler = (err, req, res, next) => {
  // Ensure we have a proper error object
  if (!err) {
    return next();
  }

  // Log error details
  logger.error('Global error handler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Handle specific error types
  let error = { ...err };
  error.message = err.message;

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = 'Validation Error';
    const validationErrors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
    error = new AppError(message, 400, 'fail', true, validationErrors);
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new AppError(message, 400);
  }

  // Handle Mongoose CastError
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, 400);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again!';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired! Please log in again.';
    error = new AppError(message, 401);
  }

  // Handle rate limit errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later.';
    error = new AppError(message, 429);
  }

  // Handle network/connection errors
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    const message = 'Service temporarily unavailable. Please try again later.';
    error = new AppError(message, 503);
  }

  // Default to 500 server error
  if (!error.statusCode) {
    error.statusCode = 500;
    error.status = 'error';
    error.isOperational = true;
  }

  // Send error response
  sendErrorResponse(error, res);
};

// Enhanced error response handler
const sendErrorResponse = (err, res) => {
  // Ensure response hasn't been sent already
  if (res.headersSent) {
    return;
  }

  const response = {
    success: false,
    status: err.status || 'error',
    message: err.message || 'Something went wrong!'
  };

  // Add validation errors if present
  if (err.validationErrors) {
    response.validationErrors = err.validationErrors;
  }

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    response.error = err;
    response.stack = err.stack;
  }

  // Add rate limit info if applicable
  if (err.statusCode === 429 && err.retryAfter) {
    response.retryAfter = err.retryAfter;
  }

  res.status(err.statusCode || 500).json(response);
};

// Async error handler wrapper
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error handler
export const handleValidationError = (errors) => {
  const formattedErrors = errors.array().map(error => ({
    field: error.path || error.param,
    message: error.msg,
    value: error.value
  }));

  return {
    success: false,
    error: 'Validation failed',
    validationErrors: formattedErrors
  };
};

// Database error handler
export const handleDatabaseError = (error) => {
  let message = 'Database operation failed';
  let statusCode = 500;

  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyValue)[0];
    message = `${field} already exists`;
    statusCode = 400;
  } else if (error.name === 'ValidationError') {
    // Mongoose validation error
    const errors = Object.values(error.errors).map(e => e.message);
    message = errors.join(', ');
    statusCode = 400;
  } else if (error.name === 'CastError') {
    // Invalid ObjectId
    message = 'Invalid ID format';
    statusCode = 400;
  }

  return new AppError(message, statusCode);
};

// Rate limit error response
export const rateLimitHandler = (req, res) => {
  const response = {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.round(req.rateLimit.resetTime / 1000) || 60
  };

  res.status(429).json(response);
};

// CORS error handler
export const corsErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation - Origin not allowed'
    });
  }
  next(err);
};

// Request timeout handler
export const timeoutHandler = (req, res, next) => {
  const timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000; // 30 seconds

  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: 'Request timeout'
      });
    }
  }, timeout);

  res.on('finish', () => {
    clearTimeout(timer);
  });

  next();
};

// Handle specific error types
export const handleSpecificErrors = {
  // Authentication errors
  authError: (message = 'Authentication failed') => new AppError(message, 401),
  
  // Authorization errors
  forbiddenError: (message = 'Access forbidden') => new AppError(message, 403),
  
  // Not found errors
  notFoundError: (resource = 'Resource') => new AppError(`${resource} not found`, 404),
  
  // Validation errors
  validationError: (message = 'Validation failed') => new AppError(message, 400),
  
  // Conflict errors
  conflictError: (message = 'Resource conflict') => new AppError(message, 409),
  
  // Rate limit errors
  rateLimitError: (message = 'Rate limit exceeded') => new AppError(message, 429),
  
  // Server errors
  serverError: (message = 'Internal server error') => new AppError(message, 500)
};

export default {
  AppError,
  notFound,
  globalErrorHandler,
  errorHandler: globalErrorHandler, // Alias for compatibility
  catchAsync,
  handleValidationError,
  handleDatabaseError,
  rateLimitHandler,
  corsErrorHandler,
  timeoutHandler,
  handleSpecificErrors
}; 