import mongoose from 'mongoose';

const socialPostSchema = new mongoose.Schema({
  // Basic Information
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },

  // Platform Information
  platforms: [{
    type: String,
    enum: ['twitter', 'instagram', 'linkedin', 'facebook', 'youtube'],
    required: true
  }],
  postType: {
    type: String,
    enum: ['text', 'image', 'video', 'link', 'story', 'reel'],
    default: 'text'
  },

  // Scheduling
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  scheduledDate: Date,
  publishedDate: Date,

  // Content Details
  hashtags: [String],
  mentions: [String],
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'gif']
    },
    url: String,
    alt: String,
    thumbnail: String
  }],

  // Targeting
  targetAudience: String,
  campaignId: String,
  category: {
    type: String,
    enum: [
      'business_update',
      'product_launch', 
      'behind_scenes',
      'industry_insights',
      'customer_success',
      'educational',
      'motivational',
      'team_spotlight',
      'company_culture',
      'event_announcement',
      'thought_leadership',
      'user_generated'
    ]
  },

  // Performance Metrics
  performance: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 }
  },

  // Platform-specific data
  platformData: {
    twitter: {
      tweetId: String,
      retweetCount: Number,
      favoriteCount: Number
    },
    instagram: {
      postId: String,
      likesCount: Number,
      commentsCount: Number
    },
    linkedin: {
      postId: String,
      likesCount: Number,
      commentsCount: Number,
      sharesCount: Number
    },
    facebook: {
      postId: String,
      likesCount: Number,
      commentsCount: Number,
      sharesCount: Number
    },
    youtube: {
      videoId: String,
      viewsCount: Number,
      likesCount: Number,
      commentsCount: Number
    }
  },

  // AI & Analytics
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiPrompt: String,
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative']
  },
  contentScore: {
    type: Number,
    min: 0,
    max: 100
  },

  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Approval Workflow
  needsApproval: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: Date,

  // Error Handling
  publishErrors: [{
    platform: String,
    error: String,
    timestamp: Date
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
socialPostSchema.index({ createdBy: 1, status: 1 });
socialPostSchema.index({ scheduledDate: 1, status: 1 });
socialPostSchema.index({ platforms: 1, status: 1 });
socialPostSchema.index({ publishedDate: -1 });
socialPostSchema.index({ createdBy: 1, publishedDate: -1 });

// Compound indexes
socialPostSchema.index({
  createdBy: 1,
  status: 1,
  scheduledDate: 1
});

// Virtual for engagement rate
socialPostSchema.virtual('engagementRate').get(function() {
  if (!this.performance.impressions || this.performance.impressions === 0) return 0;
  const totalEngagement = this.performance.likes + this.performance.shares + this.performance.comments;
  return (totalEngagement / this.performance.impressions) * 100;
});

// Virtual for formatted scheduled date
socialPostSchema.virtual('formattedScheduledDate').get(function() {
  if (!this.scheduledDate) return null;
  return this.scheduledDate.toLocaleString();
});

// Pre-save middleware
socialPostSchema.pre('save', function(next) {
  // Calculate engagement
  if (this.performance.impressions > 0) {
    const totalEngagement = this.performance.likes + this.performance.shares + this.performance.comments;
    this.performance.engagement = (totalEngagement / this.performance.impressions) * 100;
  }

  // Auto-publish if scheduled time has passed
  if (this.status === 'scheduled' && this.scheduledDate && new Date() >= this.scheduledDate) {
    this.status = 'published';
    this.publishedDate = new Date();
  }

  next();
});

// Instance Methods
socialPostSchema.methods.publish = function() {
  this.status = 'published';
  this.publishedDate = new Date();
  return this.save();
};

socialPostSchema.methods.schedule = function(date) {
  this.status = 'scheduled';
  this.scheduledDate = date;
  return this.save();
};

socialPostSchema.methods.updatePerformance = function(platformData) {
  Object.assign(this.performance, platformData);
  return this.save();
};

socialPostSchema.methods.addHashtags = function(hashtags) {
  const newHashtags = hashtags.filter(tag => !this.hashtags.includes(tag));
  this.hashtags.push(...newHashtags);
  return this.save();
};

// Static Methods
socialPostSchema.statics.findByUser = function(userId, options = {}) {
  const query = { createdBy: userId, isActive: true };

  if (options.status) query.status = options.status;
  if (options.platform) query.platforms = { $in: [options.platform] };
  if (options.category) query.category = options.category;
  
  if (options.dateFrom || options.dateTo) {
    query.createdAt = {};
    if (options.dateFrom) query.createdAt.$gte = new Date(options.dateFrom);
    if (options.dateTo) query.createdAt.$lte = new Date(options.dateTo);
  }

  return this.find(query)
    .populate('createdBy', 'firstName lastName email')
    .sort(options.sort || { createdAt: -1 });
};

socialPostSchema.statics.getScheduledPosts = function(userId) {
  return this.find({
    createdBy: userId,
    status: 'scheduled',
    scheduledDate: { $lte: new Date() },
    isActive: true
  }).sort({ scheduledDate: 1 });
};

socialPostSchema.statics.getPerformanceStats = function(userId, dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  return this.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(userId),
        status: 'published',
        publishedDate: { $gte: startDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        totalViews: { $sum: '$performance.views' },
        totalLikes: { $sum: '$performance.likes' },
        totalShares: { $sum: '$performance.shares' },
        totalComments: { $sum: '$performance.comments' },
        avgEngagement: { $avg: '$performance.engagement' }
      }
    }
  ]);
};

socialPostSchema.statics.getTopPerformingPosts = function(userId, limit = 10) {
  return this.find({
    createdBy: userId,
    status: 'published',
    isActive: true
  })
  .sort({ 'performance.engagement': -1 })
  .limit(limit)
  .populate('createdBy', 'firstName lastName');
};

socialPostSchema.statics.getPlatformStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(userId),
        status: 'published',
        isActive: true
      }
    },
    {
      $unwind: '$platforms'
    },
    {
      $group: {
        _id: '$platforms',
        postCount: { $sum: 1 },
        totalViews: { $sum: '$performance.views' },
        totalLikes: { $sum: '$performance.likes' },
        avgEngagement: { $avg: '$performance.engagement' }
      }
    },
    {
      $sort: { postCount: -1 }
    }
  ]);
};

const SocialPost = mongoose.model('SocialPost', socialPostSchema);

export default SocialPost; 