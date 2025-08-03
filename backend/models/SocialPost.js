import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  data: {
    type: String, // Base64 encoded data
    required: true
  },
  lastModified: {
    type: Number,
    default: Date.now
  }
}, { _id: false });

const performanceSchema = new mongoose.Schema({
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  comments: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  engagement: {
    type: Number,
    default: 0
  },
  reach: {
    type: Number,
    default: 0
  },
  impressions: {
    type: Number,
    default: 0
  }
}, { _id: false });

const socialPostSchema = new mongoose.Schema({
  // Basic post information
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: [2000, 'Content cannot exceed 2000 characters']
  },
  
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    default: ''
  },

  // Platform targeting
  platforms: [{
    type: String,
    required: true,
    enum: ['facebook', 'instagram', 'twitter', 'linkedin']
  }],

  // Post status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },

  // Scheduling
  scheduledDate: {
    type: Date
  },

  publishedDate: {
    type: Date
  },

  // Content enhancements
  hashtags: {
    type: String,
    trim: true,
    maxlength: [500, 'Hashtags cannot exceed 500 characters'],
    default: ''
  },

  link: {
    type: String,
    trim: true,
    default: ''
  },

  // Media attachments
  media: [mediaSchema],

  // Targeting and categorization
  targetAudience: {
    type: String,
    trim: true,
    maxlength: [200, 'Target audience cannot exceed 200 characters'],
    default: ''
  },

  category: {
    type: String,
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters'],
    default: ''
  },

  // Performance metrics
  performance: {
    type: performanceSchema,
    default: () => ({})
  },

  // Status tracking
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
socialPostSchema.index({ createdAt: -1 });
socialPostSchema.index({ status: 1 });
socialPostSchema.index({ platforms: 1 });
socialPostSchema.index({ scheduledDate: 1 });
socialPostSchema.index({ publishedDate: -1 });
socialPostSchema.index({ isActive: 1 });

// Text search index for content
socialPostSchema.index({ 
  content: 'text', 
  title: 'text', 
  hashtags: 'text' 
});

// Pre-save middleware
socialPostSchema.pre('save', function(next) {
  // Set published date when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedDate) {
    this.publishedDate = new Date();
  }
  
  // Calculate engagement rate if impressions exist
  if (this.performance.impressions > 0) {
    const totalEngagement = this.performance.likes + this.performance.shares + this.performance.comments;
    this.performance.engagement = (totalEngagement / this.performance.impressions) * 100;
  }
  
  next();
});

const SocialPost = mongoose.model('SocialPost', socialPostSchema);

export default SocialPost;
