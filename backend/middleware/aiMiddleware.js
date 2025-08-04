import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

// Rate limiting for AI requests
export const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each user to 50 AI requests per windowMs
  message: {
    success: false,
    error: 'Too many AI requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit per user
    return req.user?._id || req.ip;
  },
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded', {
      userId: req.user?._id,
      ip: req.ip,
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: 'Too many AI requests. Please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// Premium rate limiting (higher limits for paid users)
export const aiRateLimitPremium = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for premium users
  message: {
    success: false,
    error: 'AI request limit reached. Please try again later.',
    retryAfter: '15 minutes'
  },
  keyGenerator: (req) => {
    return req.user?._id || req.ip;
  }
});

// Middleware to check if user has AI access
export const checkAIAccess = (req, res, next) => {
  // In a real app, you'd check user's subscription/plan
  // For now, we'll allow all authenticated users
  
  // Check if either OpenAI or Azure OpenAI is configured
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAzureOpenAI = !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY);
  
  if (!hasOpenAI && !hasAzureOpenAI) {
    return res.status(503).json({
      success: false,
      error: 'AI service is not configured. Please contact support.',
      code: 'AI_SERVICE_UNAVAILABLE'
    });
  }

  // Log AI usage for analytics
  logger.info('AI request initiated', {
    userId: req.user._id,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent')
  });

  next();
};

// Middleware to track AI usage
export const trackAIUsage = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override json method to capture AI usage data
  res.json = function(data) {
    if (data?.data?.usage) {
      logger.info('AI usage tracked', {
        userId: req.user._id,
        path: req.path,
        usage: data.data.usage,
        timestamp: new Date().toISOString()
      });

      // In a production app, you'd save this to a usage tracking collection
      // await AIUsage.create({
      //   userId: req.user._id,
      //   endpoint: req.path,
      //   usage: data.data.usage,
      //   timestamp: new Date()
      // });
    }

    // Call original json method
    originalJson.call(this, data);
  };

  next();
};

// Error handling middleware for AI operations
export const handleAIErrors = (error, req, res, next) => {
  if (error.message?.includes('OpenAI') || error.message?.includes('Azure OpenAI') || error.message?.includes('AI service')) {
    logger.error('AI service error', {
      userId: req.user?._id,
      path: req.path,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'AI service temporarily unavailable. Please try again later.',
      code: 'AI_SERVICE_ERROR'
    });
  }

  next(error);
}; 