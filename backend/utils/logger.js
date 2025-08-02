import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.join(path.dirname(__dirname), 'logs');

// Configure transports
const transports = [];

// Always add console transport
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
  })
);

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'vibe-code-backend'
  },
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: logFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: logFormat
    })
  ]
});

// Add request logging utility
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};

// Add auth logging utilities
export const authLogger = {
  loginAttempt: (email, ip, success, reason = null) => {
    logger.info('Login attempt', {
      email,
      ip,
      success,
      reason,
      type: 'auth'
    });
  },
  
  signupAttempt: (email, ip, success, reason = null) => {
    logger.info('Signup attempt', {
      email,
      ip,
      success,
      reason,
      type: 'auth'
    });
  },
  
  otpGenerated: (email, type) => {
    logger.info('OTP generated', {
      email,
      type,
      action: 'otp_generated'
    });
  },
  
  otpVerified: (email, success, reason = null) => {
    logger.info('OTP verification', {
      email,
      success,
      reason,
      action: 'otp_verified'
    });
  },
  
  passwordReset: (email, success, reason = null) => {
    logger.info('Password reset', {
      email,
      success,
      reason,
      action: 'password_reset'
    });
  },
  
  accountLocked: (email, reason) => {
    logger.warn('Account locked', {
      email,
      reason,
      action: 'account_locked',
      type: 'security'
    });
  },
  
  suspiciousActivity: (email, ip, activity) => {
    logger.warn('Suspicious activity detected', {
      email,
      ip,
      activity,
      type: 'security'
    });
  }
};

// Add security logging utilities
export const securityLogger = {
  rateLimit: (ip, endpoint) => {
    logger.warn('Rate limit exceeded', {
      ip,
      endpoint,
      type: 'security'
    });
  },
  
  invalidToken: (token, reason) => {
    logger.warn('Invalid token detected', {
      token: token?.substring(0, 10) + '...',
      reason,
      type: 'security'
    });
  },
  
  corsViolation: (origin, ip) => {
    logger.warn('CORS violation', {
      origin,
      ip,
      type: 'security'
    });
  }
};

// Add error logging utility
export const errorLogger = {
  database: (error, context = {}) => {
    logger.error('Database error', {
      error: error.message,
      stack: error.stack,
      context,
      type: 'database'
    });
  },
  
  validation: (errors, context = {}) => {
    logger.warn('Validation error', {
      errors,
      context,
      type: 'validation'
    });
  },
  
  email: (error, context = {}) => {
    logger.error('Email service error', {
      error: error.message,
      stack: error.stack,
      context,
      type: 'email'
    });
  },
  
  api: (error, req, context = {}) => {
    logger.error('API error', {
      error: error.message,
      stack: error.stack,
      method: req?.method,
      url: req?.originalUrl,
      ip: req?.ip,
      context,
      type: 'api'
    });
  }
};

// Add performance logging utility
export const performanceLogger = {
  slowQuery: (query, duration, context = {}) => {
    logger.warn('Slow database query', {
      query,
      duration: `${duration}ms`,
      context,
      type: 'performance'
    });
  },
  
  slowRequest: (req, duration) => {
    logger.warn('Slow request', {
      method: req.method,
      url: req.originalUrl,
      duration: `${duration}ms`,
      type: 'performance'
    });
  }
};

export default logger; 