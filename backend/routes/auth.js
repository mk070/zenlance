import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import jwtUtils from '../utils/jwtUtils.js';
import emailService from '../utils/emailService.js';
import { catchAsync, AppError, handleValidationError } from '../middleware/errorMiddleware.js';
import { 
  authRateLimit, 
  otpRateLimit, 
  passwordResetRateLimit,
  checkAccountLock,
  validateRefreshToken
} from '../middleware/authMiddleware.js';
import { authLogger } from '../utils/logger.js';

const router = express.Router();

// Validation rules
const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters')
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

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Sign up
router.post('/signup', authRateLimit, signupValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const { email, password, firstName, lastName } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    authLogger.signupAttempt(email, req.ip, false, 'Email already registered');
    return res.status(400).json({
      success: false,
      error: 'An account with this email already exists'
    });
  }

  // Create user
  const user = new User({
    email,
    password,
    analytics: {
      signupSource: req.get('User-Agent')
    }
  });

  // Generate OTP for email verification
  const otp = user.generateOTP();
  await user.save();

  // Create user profile with basic info only
  const profile = new Profile({
    userId: user._id,
    firstName,
    lastName,
    // Business details will be added later in BusinessSetup
    onboarding: {
      currentStep: 'email_verification',
      completedSteps: [],
      completionScore: 30 // Basic profile created
    }
  });
  await profile.save();

  // Send verification email
  const emailResult = await emailService.sendOTPEmail(email, otp, firstName, 'verification');
  
  if (!emailResult.success) {
    authLogger.signupAttempt(email, req.ip, false, 'Email sending failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to send verification email. Please try again.'
    });
  }

  authLogger.signupAttempt(email, req.ip, true, 'Account created, verification email sent');

  res.status(201).json({
    success: true,
    message: 'Account created successfully. Please check your email for the verification code.',
    userId: user._id,
    emailSent: true
  });
}));

// Sign in
router.post('/signin', authRateLimit, checkAccountLock, signinValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const { email, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil +refreshTokens');

  if (!user) {
    authLogger.loginAttempt(email, req.ip, false, 'User not found');
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }

  // Check account status
  if (!user.isActive) {
    authLogger.loginAttempt(email, req.ip, false, 'Account deactivated');
    return res.status(403).json({
      success: false,
      error: 'Account has been deactivated'
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    authLogger.loginAttempt(email, req.ip, false, 'Invalid password');
    
    return res.status(401).json({
      success: false,
      error: 'Invalid email or password'
    });
  }

  // Check email verification
  if (!user.isEmailVerified) {
    authLogger.loginAttempt(email, req.ip, false, 'Email not verified');
    return res.status(403).json({
      success: false,
      error: 'Please verify your email before signing in',
      needsVerification: true
    });
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();
  await user.updateLastLogin(req.ip);

  // Generate tokens
  const tokenPayload = {
    id: user._id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified
  };

  const { accessToken, refreshToken } = jwtUtils.generateTokenPair(tokenPayload);

  // Store refresh token
  await user.addRefreshToken(refreshToken);

  // Get user profile
  const profile = await Profile.findOne({ userId: user._id });

  authLogger.loginAttempt(email, req.ip, true, 'Login successful');

  res.json({
    success: true,
    message: 'Login successful',
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      profile
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '15m'
    }
  });
}));

// Verify OTP
router.post('/verify-otp', authRateLimit, otpValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const { email, otp } = req.body;

  // Find user
  const user = await User.findOne({ email }).select('+otpCode +otpExpires +otpAttempts');

  if (!user) {
    authLogger.otpVerified(email, false, 'User not found');
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Verify OTP
  if (!user.verifyOTP(otp)) {
    await user.incrementOTPAttempts();
    await user.save();
    
    authLogger.otpVerified(email, false, 'Invalid or expired OTP');
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired verification code'
    });
  }

  // Mark email as verified and clear OTP
  user.isEmailVerified = true;
  user.clearOTP();
  await user.save();

  // Get user profile
  const profile = await Profile.findOne({ userId: user._id });

  // Generate tokens
  const tokenPayload = {
    id: user._id,
    email: user.email,
    role: user.role,
    isEmailVerified: true
  };

  const { accessToken, refreshToken } = jwtUtils.generateTokenPair(tokenPayload);

  // Store refresh token
  await user.addRefreshToken(refreshToken);

  // Send welcome email
  await emailService.sendWelcomeEmail(email, profile?.firstName);

  authLogger.otpVerified(email, true, 'Email verified successfully');

  res.json({
    success: true,
    message: 'Email verified successfully',
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      isEmailVerified: true,
      profile
    },
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '15m'
    }
  });
}));

// Resend OTP
router.post('/resend-otp', otpRateLimit, catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }

  // Find user
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      error: 'Email is already verified'
    });
  }

  // Generate new OTP
  const otp = user.generateOTP();
  await user.save();

  // Get user profile for personalization
  const profile = await Profile.findOne({ userId: user._id });

  // Send OTP email
  const emailResult = await emailService.sendOTPEmail(email, otp, profile?.firstName, 'verification');

  if (!emailResult.success) {
    return res.status(500).json({
      success: false,
      error: 'Failed to send verification email. Please try again.'
    });
  }

  authLogger.otpGenerated(email, 'resend_verification');

  res.json({
    success: true,
    message: 'Verification code sent successfully'
  });
}));

// Forgot password
router.post('/forgot-password', passwordResetRateLimit, passwordResetValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const { email } = req.body;

  // Find user
  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'If an account with this email exists, you will receive a password reset email.'
    });
  }

  // Generate password reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  // Get user profile for personalization
  const profile = await Profile.findOne({ userId: user._id });

  // Send password reset email
  const emailResult = await emailService.sendPasswordResetEmail(email, resetToken, profile?.firstName);

  if (!emailResult.success) {
    authLogger.passwordReset(email, false, 'Email sending failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to send password reset email. Please try again.'
    });
  }

  authLogger.passwordReset(email, true, 'Password reset email sent');

  res.json({
    success: true,
    message: 'If an account with this email exists, you will receive a password reset email.'
  });
}));

// Reset password
router.post('/reset-password', authRateLimit, resetPasswordValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const { token, password } = req.body;

  // Find user by reset token
  const user = await User.findByPasswordResetToken(token);

  if (!user) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired reset token'
    });
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Clear all refresh tokens for security
  await user.clearRefreshTokens();
  
  await user.save();

  authLogger.passwordReset(user.email, true, 'Password reset successful');

  res.json({
    success: true,
    message: 'Password reset successful. Please login with your new password.'
  });
}));

// Refresh token
router.post('/refresh-token', validateRefreshToken, catchAsync(async (req, res) => {
  const user = req.user;
  const oldRefreshToken = req.refreshToken;

  // Generate new tokens
  const tokenPayload = {
    id: user._id,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified
  };

  const { accessToken, refreshToken } = jwtUtils.generateTokenPair(tokenPayload);

  // Replace old refresh token with new one
  await user.removeRefreshToken(oldRefreshToken);
  await user.addRefreshToken(refreshToken);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '15m'
    }
  });
}));

// Logout
router.post('/logout', catchAsync(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = jwtUtils.extractTokenFromHeader(authHeader);
  const { refreshToken } = req.body;

  if (token) {
    // Blacklist access token
    jwtUtils.blacklistToken(token);

    // Get user from token and remove refresh token
    const tokenInfo = jwtUtils.getUserInfoFromToken(token);
    if (tokenInfo?.id && refreshToken) {
      const user = await User.findById(tokenInfo.id);
      if (user) {
        await user.removeRefreshToken(refreshToken);
      }
    }
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// Logout from all devices
router.post('/logout-all', catchAsync(async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = jwtUtils.extractTokenFromHeader(authHeader);

  if (token) {
    const tokenInfo = jwtUtils.getUserInfoFromToken(token);
    if (tokenInfo?.id) {
      const user = await User.findById(tokenInfo.id);
      if (user) {
        await user.clearRefreshTokens();
      }
    }
  }

  res.json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
}));

export default router; 