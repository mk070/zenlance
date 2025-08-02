import express from 'express';
import { body, validationResult } from 'express-validator';
import Profile from '../models/Profile.js';
import { catchAsync, AppError, handleValidationError } from '../middleware/errorMiddleware.js';
import { authenticate, requireEmailVerification } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get user profile
router.get('/me', authenticate, catchAsync(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'Profile not found'
    });
  }

  res.json({
    success: true,
    profile
  });
}));

// Update profile
router.patch('/me', authenticate, [
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
  body('businessName').optional().trim().isLength({ min: 1, max: 100 }),
  body('businessType').optional().isIn(['startup', 'small_business', 'medium_business', 'enterprise', 'freelancer', 'agency', 'nonprofit', 'other']),
  body('industry').optional().trim().isLength({ min: 1, max: 100 }),
  body('location.country').optional().trim().isLength({ max: 100 }),
  body('location.city').optional().trim().isLength({ max: 100 }),
  body('location.timezone').optional().trim(),
  body('teamSize').optional().isIn(['1', '2-5', '6-10', '11-25', '26-50', '51-100', '101-500', '500+']),
  body('primaryGoal').optional().isIn(['increase_sales', 'improve_efficiency', 'reduce_costs', 'expand_market', 'enhance_customer_experience', 'digital_transformation', 'other']),
  body('experienceLevel').optional().isIn(['beginner', 'intermediate', 'advanced', 'expert']),
  body('monthlyRevenue').optional().isIn(['pre_revenue', '0-1k', '1k-5k', '5k-25k', '25k-100k', '100k-500k', '500k-1m', '1m+']),
  body('currentTools').optional().isArray(),
  body('currentTools.*').optional().trim().isLength({ max: 50 }),
  body('tags').optional().isArray(),
  body('tags.*').optional().trim().isLength({ max: 30 }),
  body('notes').optional().trim().isLength({ max: 1000 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const profile = await Profile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'Profile not found'
    });
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    profile
  });
}));

// Update profile settings
router.patch('/settings', authenticate, [
  body('emailNotifications.marketing').optional().isBoolean(),
  body('emailNotifications.productUpdates').optional().isBoolean(),
  body('emailNotifications.securityAlerts').optional().isBoolean(),
  body('emailNotifications.weeklyDigest').optional().isBoolean(),
  body('privacy.profileVisibility').optional().isIn(['public', 'private', 'contacts']),
  body('privacy.allowAnalytics').optional().isBoolean(),
  body('dashboard.layout').optional().isIn(['default', 'compact', 'detailed'])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const updates = {};
  
  // Handle nested updates
  if (req.body.emailNotifications) {
    Object.keys(req.body.emailNotifications).forEach(key => {
      updates[`settings.emailNotifications.${key}`] = req.body.emailNotifications[key];
    });
  }

  if (req.body.privacy) {
    Object.keys(req.body.privacy).forEach(key => {
      updates[`settings.privacy.${key}`] = req.body.privacy[key];
    });
  }

  if (req.body.dashboard) {
    Object.keys(req.body.dashboard).forEach(key => {
      updates[`settings.dashboard.${key}`] = req.body.dashboard[key];
    });
  }

  const profile = await Profile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'Profile not found'
    });
  }

  res.json({
    success: true,
    message: 'Settings updated successfully',
    profile
  });
}));

// Complete onboarding step
router.patch('/onboarding/:step', authenticate, catchAsync(async (req, res) => {
  const { step } = req.params;
  
  const validSteps = ['profileSetup', 'businessInfo', 'goals', 'integrations', 'welcome'];
  
  if (!validSteps.includes(step)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid onboarding step'
    });
  }

  const profile = await Profile.findOne({ userId: req.user._id });
  
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'Profile not found'
    });
  }

  await profile.completeOnboardingStep(step);

  res.json({
    success: true,
    message: `${step} completed successfully`,
    profile
  });
}));

// Get onboarding status
router.get('/onboarding', authenticate, catchAsync(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'Profile not found'
    });
  }

  const onboardingStatus = {
    completed: profile.onboardingCompleted,
    steps: profile.onboardingSteps,
    completionScore: profile.analytics.completionScore,
    isProfileComplete: profile.isProfileComplete()
  };

  res.json({
    success: true,
    onboarding: onboardingStatus
  });
}));

// Get profile analytics
router.get('/analytics', authenticate, catchAsync(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'Profile not found'
    });
  }

  const analytics = {
    completionScore: profile.analytics.completionScore,
    profileViews: profile.analytics.profileViews,
    lastProfileUpdate: profile.analytics.lastProfileUpdate,
    subscriptionInfo: profile.getSubscriptionInfo(),
    memberSince: profile.createdAt
  };

  res.json({
    success: true,
    analytics
  });
}));

export default router; 