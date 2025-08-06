import crypto from 'crypto';
import User from '../models/User.js';
import jwtUtils from '../utils/jwtUtils.js';
import { AppError } from './errorMiddleware.js';
import { authLogger, securityLogger } from '../utils/logger.js';
import rateLimit from 'express-rate-limit';

// Basic authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return next(new AppError('Access denied. No token provided.', 401));
    }

    // Check if token is blacklisted
    if (jwtUtils.isTokenBlacklisted(token)) {
      return next(new AppError('Token has been revoked', 401));
    }

    // Verify token
    const result = jwtUtils.verifyAccessToken(token);

    if (!result.valid) {
      if (result.expired) {
        return next(new AppError('Token expired. Please refresh your token.', 401));
      }
      return next(new AppError('Invalid token', 401));
    }

    // Get user from database
    const user = await User.findById(result.decoded.id).select('+isEmailVerified +role +isActive');

    if (!user) {
      return next(new AppError('User not found', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Account has been deactivated', 401));
    }

    // Update last activity
    user.analytics.lastActivity = new Date();
    await user.save({ validateBeforeSave: false });

    // Attach user to request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    securityLogger.invalidToken(req.headers.authorization, error.message);
    next(new AppError('Authentication failed', 401));
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtUtils.extractTokenFromHeader(authHeader);

    if (token) {
      const result = jwtUtils.verifyAccessToken(token);
      
      if (result.valid && !jwtUtils.isTokenBlacklisted(token)) {
        const user = await User.findById(result.decoded.id).select('+isEmailVerified +role +isActive');
        
        if (user && user.isActive) {
          req.user = user;
          req.token = token;
        }
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without authentication
    next();
  }
};

// Email verification requirement
export const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!req.user.isEmailVerified) {
    return next(new AppError('Email verification required. Please verify your email to continue.', 403));
  }

  next();
};

// Role-based authorization
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      authLogger.suspiciousActivity(
        req.user.email, 
        req.ip, 
        `Unauthorized access attempt to ${req.originalUrl}`
      );
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

// Admin only access
export const adminOnly = authorize('admin');

// Moderator and admin access
export const moderatorOrAdmin = authorize('moderator', 'admin');

// Account status checks
export const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (!req.user.isActive) {
    return next(new AppError('Account has been deactivated', 403));
  }

  next();
};

// Check for account lockout
export const checkAccountLock = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next();
    }

    const user = await User.findOne({ email }).select('+lockUntil +loginAttempts');
    
    if (user && user.isLocked) {
      const lockTime = Math.round((user.lockUntil - Date.now()) / 60000);
      authLogger.accountLocked(email, `Account locked for ${lockTime} minutes`);
      
      return next(new AppError(
        `Account temporarily locked due to too many failed login attempts. Try again in ${lockTime} minutes.`,
        423
      ));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,// Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    securityLogger.rateLimit(req.ip, req.originalUrl);
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiting for OTP requests
export const otpRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 OTP requests per windowMs
  message: {
    success: false,
    error: 'Too many OTP requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per IP + email combination
    return `${req.ip}_${req.body.email || 'no-email'}`;
  },
  handler: (req, res) => {
    securityLogger.rateLimit(req.ip, `${req.originalUrl} - OTP`);
    res.status(429).json({
      success: false,
      error: 'Too many OTP requests, please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiting for password reset
export const passwordResetRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 password reset requests per windowMs
  message: {
    success: false,
    error: 'Too many password reset requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.ip}_${req.body.email || 'no-email'}`;
  },
  handler: (req, res) => {
    securityLogger.rateLimit(req.ip, `${req.originalUrl} - Password Reset`);
    res.status(429).json({
      success: false,
      error: 'Too many password reset requests, please try again later.',
      retryAfter: Math.round(req.rateLimit.resetTime / 1000)
    });
  }
});

// Refresh token validation
export const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    // Check if token is blacklisted
    if (jwtUtils.isTokenBlacklisted(refreshToken)) {
      return next(new AppError('Refresh token has been revoked', 401));
    }

    // Verify refresh token
    const result = jwtUtils.verifyRefreshToken(refreshToken);

    if (!result.valid) {
      if (result.expired) {
        return next(new AppError('Refresh token expired. Please login again.', 401));
      }
      return next(new AppError('Invalid refresh token', 401));
    }

    // Get user and check if refresh token exists
    const user = await User.findById(result.decoded.id).select('+refreshTokens +isActive');

    if (!user || !user.isActive) {
      return next(new AppError('User not found or inactive', 401));
    }

    // Check if refresh token exists in user's tokens
    const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken);
    
    if (!tokenExists) {
      return next(new AppError('Invalid refresh token', 401));
    }

    req.user = user;
    req.refreshToken = refreshToken;

    next();
  } catch (error) {
    next(new AppError('Refresh token validation failed', 401));
  }
};

// Security headers middleware
export const securityHeaders = (req, res, next) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  next();
};

// Request ID middleware
export const requestId = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.set('X-Request-ID', req.requestId);
  next();
};

// IP extraction middleware (for proxies)
export const extractIP = (req, res, next) => {
  req.clientIP = req.ip || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress ||
                 (req.connection.socket ? req.connection.socket.remoteAddress : null);
  next();
};

// User agent validation
export const validateUserAgent = (req, res, next) => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent || userAgent.length < 10) {
    securityLogger.suspiciousActivity(
      'unknown', 
      req.ip, 
      'Missing or suspicious user agent'
    );
  }
  
  next();
};

// Suspicious activity detection
export const detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /vbscript/i,
    /onload/i,
    /onerror/i,
    /<iframe/i,
    /<script/i,
    /eval\(/i,
    /expression\(/i
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  // Check request body
  if (req.body && checkValue(req.body)) {
    securityLogger.suspiciousActivity(
      req.user?.email || 'anonymous',
      req.ip,
      'Suspicious content in request body'
    );
  }

  // Check query parameters
  if (req.query && checkValue(req.query)) {
    securityLogger.suspiciousActivity(
      req.user?.email || 'anonymous',
      req.ip,
      'Suspicious content in query parameters'
    );
  }

  next();
};

export default {
  authenticate,
  optionalAuth,
  requireEmailVerification,
  authorize,
  adminOnly,
  moderatorOrAdmin,
  requireActiveAccount,
  checkAccountLock,
  authRateLimit,
  otpRateLimit,
  passwordResetRateLimit,
  validateRefreshToken,
  securityHeaders,
  requestId,
  extractIP,
  validateUserAgent,
  detectSuspiciousActivity
}; 