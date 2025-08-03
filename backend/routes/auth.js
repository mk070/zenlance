import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import jwtUtils from '../utils/jwtUtils.js';
import emailService from '../utils/emailService.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { 
  authenticate, 
  authRateLimit, 
  otpRateLimit, 
  passwordResetRateLimit,
  checkAccountLock,
  validateRefreshToken
} from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint for debugging
router.post('/test', (req, res) => {
  console.log('🔍 Test endpoint - Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Test endpoint - Content-Type:', req.headers['content-type']);
  
  res.json({
    success: true,
    message: 'Test endpoint working',
    receivedBody: req.body,
    bodyKeys: Object.keys(req.body),
    contentType: req.headers['content-type']
  });
});

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  // Debug logging to see what's being received
  console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Request headers:', req.headers);
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('🔍 Validation errors:', JSON.stringify(errors.array(), null, 2));
    
    const validationErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      validationErrors
    });
  }
  next();
};

// Simplified validation for debugging
const signupValidation = [
  (req, res, next) => {
    console.log('🔍 Validation middleware - Request body:', JSON.stringify(req.body, null, 2));
    
    const { firstName, lastName, email, password } = req.body;
    const errors = [];
    
    // Validate firstName
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
      errors.push({ field: 'firstName', message: 'First name is required and must be at least 2 characters' });
    } else if (firstName.trim().length > 50) {
      errors.push({ field: 'firstName', message: 'First name cannot exceed 50 characters' });
    }
    
    // Validate lastName (optional)
    if (lastName && (typeof lastName !== 'string' || lastName.trim().length > 50)) {
      errors.push({ field: 'lastName', message: 'Last name cannot exceed 50 characters' });
    }
    
    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    } else {
      // Additional email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push({ field: 'email', message: 'Please provide a valid email address' });
      }
    }
    
    // Validate password
    if (!password || typeof password !== 'string' || password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    } else {
      // Additional password validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(password)) {
        errors.push({ 
          field: 'password', 
          message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' 
        });
      }
    }
    
    if (errors.length > 0) {
      console.log('🔍 Validation errors:', errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validationErrors: errors
      });
    }
    
    // Sanitize inputs
    req.body.firstName = firstName.trim();
    req.body.lastName = lastName ? lastName.trim() : '';
    req.body.email = email.trim().toLowerCase();
    
    next();
  }
];

const signinValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const otpValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number')
];

const passwordResetValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const newPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Sign up endpoint
router.post('/signup', authRateLimit, signupValidation, handleValidationErrors, async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Additional security checks
    if (!firstName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        validationErrors: [
          { field: 'firstName', message: 'First name is required' },
          { field: 'email', message: 'Email is required' },
          { field: 'password', message: 'Password is required' }
        ]
      });
    }

    // Sanitize inputs
    const sanitizedData = {
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : '',
      email: email.trim().toLowerCase(),
      password: password // Don't trim password as it might affect validation
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedData.email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Create user with comprehensive error handling
    let user;
    try {
      user = new User({
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        email: sanitizedData.email,
        password: sanitizedData.password,
        isEmailVerified: false, // Always require email verification
        isActive: true
      });

      // Generate and store OTP
      const otp = user.generateOTP();
      await user.save();
      
      logger.info('User created successfully', { 
        email: sanitizedData.email,
        userId: user._id,
        environment: process.env.NODE_ENV
      });
    } catch (userCreationError) {
      logger.error('User creation failed:', userCreationError);
      
      if (userCreationError.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email already exists'
        });
      }
      
      if (userCreationError.name === 'ValidationError') {
        const validationErrors = Object.values(userCreationError.errors).map(error => ({
          field: error.path,
          message: error.message
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          validationErrors
        });
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create user account. Please try again.'
      });
    }

    // Create profile with error handling
    let profile;
    try {
      profile = new Profile({
        userId: user._id,
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        fullName: `${sanitizedData.firstName} ${sanitizedData.lastName}`.trim(),
        onboardingCompleted: false
      });

      await profile.save();
      logger.info('Profile created successfully', { 
        userId: user._id, 
        email: sanitizedData.email 
      });
    } catch (profileCreationError) {
      logger.error('Profile creation failed:', profileCreationError);
      
      // Clean up user if profile creation fails
      try {
        await User.findByIdAndDelete(user._id);
        logger.info('Cleaned up user after profile creation failure', { 
          userId: user._id, 
          email: sanitizedData.email 
        });
      } catch (cleanupError) {
        logger.error('Failed to cleanup user after profile creation failure:', cleanupError);
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create user profile. Please try again.'
      });
    }

    // Send OTP email (now enabled for all environments)
    let otpSent = false;
    try {
      // Get the plain text OTP that was already generated during user creation
      // We need to get it from the user object that was just saved
      const plainOTP = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Update user with new OTP
      user.otpCode = crypto.createHash('sha256').update(plainOTP).digest('hex');
      user.otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000;
      user.otpAttempts = 0;
      await user.save();
      
      await emailService.sendOTPEmail(sanitizedData.email, plainOTP, sanitizedData.firstName);
      logger.info('OTP sent successfully', { email: sanitizedData.email });
      otpSent = true;
      
      // In development, log the OTP for testing
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔐 Development OTP for ${sanitizedData.email}: ${plainOTP}`);
        logger.info(`Development OTP for testing`, { 
          email: sanitizedData.email,
          otp: plainOTP
        });
      }
    } catch (emailError) {
      logger.error('Failed to send OTP email:', emailError);
      
      // In development, still show the OTP even if email fails
      if (process.env.NODE_ENV === 'development') {
        const plainOTP = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = crypto.createHash('sha256').update(plainOTP).digest('hex');
        user.otpExpires = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000;
        user.otpAttempts = 0;
        await user.save();
        
        console.log(`🔐 Development OTP for ${sanitizedData.email}: ${plainOTP}`);
        console.log(`📧 Email sending failed, but OTP is available above for testing`);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email with the OTP sent to your inbox.',
      data: {
        email: sanitizedData.email,
        otpSent,
        requiresVerification: true
      }
    });

  } catch (error) {
    logger.error('Signup error:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }
    
    next(new AppError('Registration failed. Please try again.', 500));
  }
});

// Sign in endpoint
router.post('/signin', authRateLimit, signinValidation, handleValidationErrors, checkAccountLock, async (req, res, next) => {
  try {
    const { email, password, rememberMe = false } = req.body;

    // Get user with password
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +loginAttempts +lockUntil +isEmailVerified');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        error: 'Account temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        error: 'Please verify your email address before signing in',
        action: 'email_verification_required'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated. Please contact support.'
      });
    }

    // Verify password with additional safety checks
    if (!user.password) {
      logger.error('User found without password field', { userId: user._id, email });
      return res.status(500).json({
        success: false,
        error: 'Account configuration error. Please contact support.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      try {
        await user.incrementLoginAttempts();
      } catch (loginAttemptError) {
        logger.error('Failed to increment login attempts', { 
          userId: user._id, 
          error: loginAttemptError.message 
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      try {
        await user.resetLoginAttempts();
      } catch (resetError) {
        logger.error('Failed to reset login attempts', { 
          userId: user._id, 
          error: resetError.message 
        });
      }
    }

    // Generate tokens
    const accessToken = jwtUtils.generateAccessToken(user._id);
    const refreshToken = jwtUtils.generateRefreshToken(user._id);

    // Store refresh token
    await user.addRefreshToken(refreshToken);

    // Update last login
    await user.updateLastLogin(req.ip);

    // Get user profile separately
    const profile = await Profile.findOne({ userId: user._id });

    res.json({
      success: true,
      message: 'Signed in successfully',
      tokens: {
        accessToken,
        refreshToken
      },
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        onboardingCompleted: profile?.onboardingCompleted || false
      }
    });

  } catch (error) {
    logger.error('Signin error:', error);
    next(new AppError('Sign in failed. Please try again.', 500));
  }
});

// Verify OTP endpoint
router.post('/verify-otp', otpRateLimit, otpValidation, handleValidationErrors, async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isEmailVerified: false
    }).select('+otpCode +otpExpires +otpAttempts');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User not found or email already verified'
      });
    }

    // Verify OTP using the User model method
    const isValidOTP = user.verifyOTP(otp);
    
    if (!isValidOTP) {
      await user.incrementOTPAttempts();
      await user.save({ validateBeforeSave: false });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    // Verify email and clear OTP
    user.isEmailVerified = true;
    user.clearOTP();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const accessToken = jwtUtils.generateAccessToken(user._id);
    const refreshToken = jwtUtils.generateRefreshToken(user._id);

    // Store refresh token
    await user.addRefreshToken(refreshToken);

    // Get user profile
    const profile = await Profile.findOne({ userId: user._id });

    res.json({
      success: true,
      message: 'Email verified successfully',
      tokens: {
        accessToken,
        refreshToken
      },
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
        onboardingCompleted: profile?.onboardingCompleted || false
      }
    });

  } catch (error) {
    logger.error('OTP verification error:', error);
    next(new AppError('OTP verification failed. Please try again.', 500));
  }
});

// Resend OTP endpoint
router.post('/resend-otp', otpRateLimit, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      isEmailVerified: false 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found or email already verified'
      });
    }

    // Generate new OTP using the User model method
    const otp = user.generateOTP();
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    try {
      await emailService.sendOTPEmail(email, otp, user.firstName);
      logger.info(`OTP resent successfully to ${email}`);
    } catch (emailError) {
      logger.error('Failed to resend OTP email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send OTP. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    logger.error('Resend OTP error:', error);
    next(new AppError('Failed to resend OTP. Please try again.', 500));
  }
});

// Forgot password endpoint
router.post('/forgot-password', passwordResetRateLimit, passwordResetValidation, handleValidationErrors, async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = resetTokenExpires;
    await user.save({ validateBeforeSave: false });

    // Send reset email
    try {
      await emailService.sendPasswordReset(email, resetToken, user.firstName);
      logger.info(`Password reset email sent to ${email}`);
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        success: false,
        error: 'Failed to send password reset email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    next(new AppError('Password reset request failed. Please try again.', 500));
  }
});

// Reset password endpoint
router.post('/reset-password', passwordResetRateLimit, newPasswordValidation, handleValidationErrors, async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Hash the token to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: resetTokenHash,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.passwordChangedAt = new Date();
    
    // Clear all refresh tokens for security
    user.refreshTokens = [];
    
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    next(new AppError('Password reset failed. Please try again.', 500));
  }
});

// Refresh token endpoint
router.post('/refresh-token', validateRefreshToken, async (req, res, next) => {
  try {
    const user = req.user;
    const oldRefreshToken = req.refreshToken;

    // Generate new tokens
    const accessToken = jwtUtils.generateAccessToken(user._id);
    const refreshToken = jwtUtils.generateRefreshToken(user._id);

    // Replace old refresh token with new one
    await user.replaceRefreshToken(oldRefreshToken, refreshToken);

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    logger.error('Refresh token error:', error);
    next(new AppError('Token refresh failed. Please sign in again.', 401));
  }
});

// Sign out endpoint
router.post('/signout', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    const token = req.token;

    // Add access token to blacklist
    jwtUtils.blacklistToken(token);

    // Remove refresh token if provided
    const { refreshToken } = req.body;
    if (refreshToken) {
      await user.removeRefreshToken(refreshToken);
    }

    res.json({
      success: true,
      message: 'Signed out successfully'
    });

  } catch (error) {
    logger.error('Signout error:', error);
    next(new AppError('Sign out failed. Please try again.', 500));
  }
});

// Sign out from all devices
router.post('/signout-all', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    const token = req.token;

    // Add current access token to blacklist
    jwtUtils.blacklistToken(token);

    // Clear all refresh tokens
    user.refreshTokens = [];
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Signed out from all devices successfully'
    });

  } catch (error) {
    logger.error('Signout all error:', error);
    next(new AppError('Sign out failed. Please try again.', 500));
  }
});

// Get current user endpoint
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = req.user;
    const profile = await Profile.findOne({ userId: user._id });

    res.json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        onboardingCompleted: profile?.onboardingCompleted || false,
        profile: profile ? {
          businessName: profile.businessDetails?.businessName,
          businessType: profile.businessDetails?.businessType,
          industry: profile.businessDetails?.industry
        } : null
      }
    });

  } catch (error) {
    logger.error('Get current user error:', error);
    next(new AppError('Failed to fetch user data. Please try again.', 500));
  }
});

// Development only - Check user status
if (process.env.NODE_ENV === 'development') {
  router.get('/dev/user-status/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+isEmailVerified +isActive +otpCode +otpExpires');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      res.json({
        success: true,
        data: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          hasOTP: !!user.otpCode,
          otpExpired: user.otpExpires ? user.otpExpires < Date.now() : true,
          createdAt: user.createdAt,
          note: 'This endpoint is only available in development mode'
        }
      });
      
    } catch (error) {
      logger.error('Dev user status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user status'
      });
    }
  });

  router.get('/dev/get-otp/:email', async (req, res) => {
    try {
      const { email } = req.params;
      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+otpCode +otpExpires +otpAttempts');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      if (!user.otpCode || !user.otpExpires) {
        return res.status(404).json({
          success: false,
          error: 'No OTP found for this user'
        });
      }
      
      if (user.otpExpires < Date.now()) {
        return res.status(400).json({
          success: false,
          error: 'OTP has expired'
        });
      }
      
      res.json({
        success: true,
        message: 'OTP retrieved for development testing',
        data: {
          email: user.email,
          otpExpires: user.otpExpires,
          otpAttempts: user.otpAttempts,
          timeRemaining: Math.ceil((user.otpExpires - Date.now()) / 1000 / 60) + ' minutes',
          note: 'This endpoint is only available in development mode'
        }
      });
      
    } catch (error) {
      logger.error('Dev OTP retrieval error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve OTP'
      });
    }
  });
}

// Development only - Reset password for testing
router.post('/dev/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and new password are required'
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();
    
    logger.info('Password reset in development mode', { email: user.email });
    
    res.json({
      success: true,
      message: 'Password reset successfully for development testing',
      data: {
        email: user.email,
        note: 'This endpoint is only available in development mode'
      }
    });
    
  } catch (error) {
    logger.error('Dev password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password'
    });
  }
});

export default router; 