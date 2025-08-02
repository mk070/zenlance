import { logger, errorLogger } from '../utils/logger.js';

// Custom error class
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found middleware
export const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  errorLogger.api(err, req, {
    body: req.body,
    params: req.params,
    query: req.query,
    headers: {
      'user-agent': req.get('User-Agent'),
      'authorization': req.get('Authorization') ? 'Bearer [REDACTED]' : undefined
    }
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`;
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(error => error.message).join(', ');
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid authentication token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Authentication token expired';
    error = new AppError(message, 401);
  }

  // Rate limit error
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = new AppError(message, 429);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large';
    error = new AppError(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = new AppError(message, 400);
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  // Send error response
  const response = {
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: error
    })
  };

  // Add request ID if available
  if (req.requestId) {
    response.requestId = req.requestId;
  }

  // Add validation errors if available
  if (err.name === 'ValidationError') {
    response.validationErrors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));
  }

  res.status(statusCode).json(response);
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
  errorHandler,
  catchAsync,
  handleValidationError,
  handleDatabaseError,
  rateLimitHandler,
  corsErrorHandler,
  timeoutHandler,
  handleSpecificErrors
}; 