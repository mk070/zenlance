import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { catchAsync, AppError, handleValidationError } from '../middleware/errorMiddleware.js';
import { authenticate, requireEmailVerification, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get current user info
router.get('/me', authenticate, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  res.json({
    success: true,
    user
  });
}));

// Update user preferences
router.patch('/preferences', authenticate, [
  body('theme').optional().isIn(['light', 'dark', 'system']),
  body('language').optional().isLength({ min: 2, max: 5 }),
  body('notifications.email').optional().isBoolean(),
  body('notifications.marketing').optional().isBoolean()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const updates = {};
  
  if (req.body.theme) updates['preferences.theme'] = req.body.theme;
  if (req.body.language) updates['preferences.language'] = req.body.language;
  if (req.body.notifications?.email !== undefined) {
    updates['preferences.notifications.email'] = req.body.notifications.email;
  }
  if (req.body.notifications?.marketing !== undefined) {
    updates['preferences.notifications.marketing'] = req.body.notifications.marketing;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id, 
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    user
  });
}));

// Change password
router.patch('/change-password', authenticate, requireEmailVerification, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      error: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  
  // Clear all refresh tokens for security (force re-login on all devices)
  await user.clearRefreshTokens();
  
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully. Please login again on all devices.'
  });
}));

// Deactivate account
router.patch('/deactivate', authenticate, requireEmailVerification, [
  body('password').notEmpty().withMessage('Password is required to deactivate account')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const { password } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      error: 'Password is incorrect'
    });
  }

  // Deactivate account
  user.isActive = false;
  await user.clearRefreshTokens();
  await user.save();

  res.json({
    success: true,
    message: 'Account deactivated successfully'
  });
}));

// Get user sessions (refresh tokens)
router.get('/sessions', authenticate, catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('+refreshTokens');
  
  const sessions = user.refreshTokens.map(token => ({
    id: token._id,
    createdAt: token.createdAt,
    isCurrentSession: token.token === req.body.currentRefreshToken
  }));

  res.json({
    success: true,
    sessions
  });
}));

// Revoke specific session
router.delete('/sessions/:sessionId', authenticate, catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  
  const user = await User.findById(req.user._id).select('+refreshTokens');
  
  const tokenToRemove = user.refreshTokens.find(token => token._id.toString() === sessionId);
  
  if (!tokenToRemove) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  await user.removeRefreshToken(tokenToRemove.token);

  res.json({
    success: true,
    message: 'Session revoked successfully'
  });
}));

// Admin routes
router.get('/all', authenticate, adminOnly, catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .populate('profile', 'firstName lastName businessName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();

  res.json({
    success: true,
    users,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total
    }
  });
}));

export default router; 