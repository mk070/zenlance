import express from 'express';
import { body, validationResult, query } from 'express-validator';
import SocialPost from '../models/SocialPost.js';
import { catchAsync, AppError, handleValidationError } from '../middleware/errorMiddleware.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all social posts for user
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'scheduled', 'published', 'failed']),
  query('platform').optional().isIn(['twitter', 'instagram', 'linkedin', 'facebook', 'youtube']),
  query('search').optional().trim(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('sortBy').optional().isIn(['createdAt', 'scheduledDate', 'publishedDate', 'performance.engagement']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const {
    page = 1,
    limit = 20,
    status,
    platform,
    search,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build query
  const query = { 
    createdBy: req.user._id,
    isActive: true
  };

  if (status) query.status = status;
  if (platform) query.platforms = { $in: [platform] };

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  if (search) {
    query.$or = [
      { content: { $regex: search, $options: 'i' } },
      { title: { $regex: search, $options: 'i' } },
      { hashtags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Build sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [posts, totalCount] = await Promise.all([
    SocialPost.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    SocialPost.countDocuments(query)
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.json({
    success: true,
    data: {
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
}));

// Get social media analytics
router.get('/analytics', authenticate, [
  query('days').optional().isInt({ min: 1, max: 365 })
], catchAsync(async (req, res) => {
  const { days = 30 } = req.query;

  const [performanceStats, platformStats, topPosts] = await Promise.all([
    SocialPost.getPerformanceStats(req.user._id, parseInt(days)),
    SocialPost.getPlatformStats(req.user._id),
    SocialPost.getTopPerformingPosts(req.user._id, 5)
  ]);

  const totalPosts = await SocialPost.countDocuments({
    createdBy: req.user._id,
    isActive: true
  });

  res.json({
    success: true,
    data: {
      performanceStats: performanceStats[0] || {
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalShares: 0,
        totalComments: 0,
        avgEngagement: 0
      },
      platformStats,
      topPosts,
      totalPosts
    }
  });
}));

// Get connected social accounts (mock data for now)
router.get('/accounts', authenticate, catchAsync(async (req, res) => {
  // This would normally fetch from a social accounts table
  // For now, return mock data
  const mockAccounts = [
    {
      platform: 'twitter',
      username: '@yourcompany',
      connected: true,
      isActive: true,
      accessToken: 'encrypted_token',
      connectedAt: new Date('2024-01-01')
    },
    {
      platform: 'linkedin',
      username: 'Your Company',
      connected: true,
      isActive: true,
      accessToken: 'encrypted_token',
      connectedAt: new Date('2024-01-01')
    },
    {
      platform: 'instagram',
      username: '@yourcompany',
      connected: false,
      isActive: false,
      accessToken: null,
      connectedAt: null
    },
    {
      platform: 'facebook',
      username: 'Your Company Page',
      connected: false,
      isActive: false,
      accessToken: null,
      connectedAt: null
    },
    {
      platform: 'youtube',
      username: 'Your Company Channel',
      connected: false,
      isActive: false,
      accessToken: null,
      connectedAt: null
    }
  ];

  res.json({
    success: true,
    data: {
      accounts: mockAccounts
    }
  });
}));

// Get single social post
router.get('/:id', authenticate, catchAsync(async (req, res) => {
  const post = await SocialPost.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isActive: true
  }).populate('createdBy', 'firstName lastName email');

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  res.json({
    success: true,
    data: {
      post
    }
  });
}));

// Create new social post
router.post('/', authenticate, [
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Content is required and must be less than 5000 characters'),
  body('title').optional().trim().isLength({ max: 200 }),
  body('platforms').isArray({ min: 1 }).withMessage('At least one platform is required'),
  body('platforms.*').isIn(['twitter', 'instagram', 'linkedin', 'facebook', 'youtube']),
  body('postType').optional().isIn(['text', 'image', 'video', 'link', 'story', 'reel']),
  body('scheduledDate').optional().isISO8601(),
  body('hashtags').optional().isArray(),
  body('hashtags.*').optional().trim().isLength({ max: 50 }),
  body('mentions').optional().isArray(),
  body('mentions.*').optional().trim().isLength({ max: 50 }),
  body('targetAudience').optional().trim().isLength({ max: 200 }),
  body('category').optional().isIn([
    'business_update', 'product_launch', 'behind_scenes', 'industry_insights',
    'customer_success', 'educational', 'motivational', 'team_spotlight',
    'company_culture', 'event_announcement', 'thought_leadership', 'user_generated'
  ])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const postData = {
    ...req.body,
    createdBy: req.user._id
  };

  // If scheduledDate is provided, set status to scheduled
  if (postData.scheduledDate) {
    postData.status = 'scheduled';
  } else if (req.body.status === 'published') {
    postData.status = 'published';
    postData.publishedDate = new Date();
  }

  const post = new SocialPost(postData);
  await post.save();

  await post.populate('createdBy', 'firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Social post created successfully',
    data: {
      post
    }
  });
}));

// Update social post
router.put('/:id', authenticate, [
  body('content').optional().trim().isLength({ min: 1, max: 5000 }),
  body('title').optional().trim().isLength({ max: 200 }),
  body('platforms').optional().isArray({ min: 1 }),
  body('platforms.*').optional().isIn(['twitter', 'instagram', 'linkedin', 'facebook', 'youtube']),
  body('postType').optional().isIn(['text', 'image', 'video', 'link', 'story', 'reel']),
  body('scheduledDate').optional().isISO8601(),
  body('hashtags').optional().isArray(),
  body('mentions').optional().isArray(),
  body('status').optional().isIn(['draft', 'scheduled', 'published', 'failed'])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const post = await SocialPost.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isActive: true
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  Object.assign(post, req.body);
  await post.save();

  await post.populate('createdBy', 'firstName lastName email');

  res.json({
    success: true,
    message: 'Social post updated successfully',
    data: {
      post
    }
  });
}));

// Delete social post (soft delete)
router.delete('/:id', authenticate, catchAsync(async (req, res) => {
  const post = await SocialPost.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isActive: true
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  post.isActive = false;
  await post.save();

  res.json({
    success: true,
    message: 'Social post deleted successfully'
  });
}));

// Publish post immediately
router.post('/:id/publish', authenticate, catchAsync(async (req, res) => {
  const post = await SocialPost.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isActive: true
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  await post.publish();

  res.json({
    success: true,
    message: 'Post published successfully',
    data: {
      post
    }
  });
}));

// Connect social account
router.post('/accounts/:platform/connect', authenticate, [
  body('accessToken').notEmpty().withMessage('Access token is required'),
  body('username').optional().trim(),
  body('accountId').optional().trim()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const { platform } = req.params;
  const { accessToken, username, accountId } = req.body;

  if (!['twitter', 'instagram', 'linkedin', 'facebook', 'youtube'].includes(platform)) {
    throw new AppError('Invalid platform', 400);
  }

  // This would normally save to a social accounts table
  // For now, just return success
  res.json({
    success: true,
    message: `${platform} account connected successfully`,
    data: {
      platform,
      username: username || `@${platform}`,
      connected: true,
      connectedAt: new Date()
    }
  });
}));

// Disconnect social account
router.delete('/accounts/:platform/disconnect', authenticate, catchAsync(async (req, res) => {
  const { platform } = req.params;

  if (!['twitter', 'instagram', 'linkedin', 'facebook', 'youtube'].includes(platform)) {
    throw new AppError('Invalid platform', 400);
  }

  // This would normally remove from social accounts table
  // For now, just return success
  res.json({
    success: true,
    message: `${platform} account disconnected successfully`
  });
}));

// Get scheduled posts that need to be published
router.get('/scheduled/pending', authenticate, catchAsync(async (req, res) => {
  const posts = await SocialPost.getScheduledPosts(req.user._id);

  res.json({
    success: true,
    data: {
      posts
    }
  });
}));

// Update post performance metrics
router.post('/:id/performance', authenticate, [
  body('views').optional().isInt({ min: 0 }),
  body('likes').optional().isInt({ min: 0 }),
  body('shares').optional().isInt({ min: 0 }),
  body('comments').optional().isInt({ min: 0 }),
  body('clicks').optional().isInt({ min: 0 }),
  body('reach').optional().isInt({ min: 0 }),
  body('impressions').optional().isInt({ min: 0 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const post = await SocialPost.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isActive: true
  });

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  await post.updatePerformance(req.body);

  res.json({
    success: true,
    message: 'Performance metrics updated successfully',
    data: {
      post
    }
  });
}));

export default router; 