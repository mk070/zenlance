import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  fullName: {
    type: String,
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  avatar: {
    type: String,
    default: null
  },
  businessName: {
    type: String,
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessType: {
    type: String,
    enum: [
      'startup',
      'small_business',
      'medium_business',
      'enterprise',
      'freelancer',
      'agency',
      'nonprofit',
      'other'
    ]
  },
  industry: {
    type: String,
    trim: true,
    maxlength: [100, 'Industry cannot exceed 100 characters']
  },
  location: {
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters']
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  teamSize: {
    type: String,
    enum: [
      '1',
      '2-5',
      '6-10',
      '11-25',
      '26-50',
      '51-100',
      '101-500',
      '500+'
    ]
  },
  primaryGoal: {
    type: String,
    enum: [
      'increase_sales',
      'improve_efficiency',
      'reduce_costs',
      'expand_market',
      'enhance_customer_experience',
      'digital_transformation',
      'other'
    ]
  },
  experienceLevel: {
    type: String,
    enum: [
      'beginner',
      'intermediate',
      'advanced',
      'expert'
    ]
  },
  monthlyRevenue: {
    type: String,
    enum: [
      'pre_revenue',
      '0-1k',
      '1k-5k',
      '5k-25k',
      '25k-100k',
      '100k-500k',
      '500k-1m',
      '1m+'
    ]
  },
  currentTools: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tool name cannot exceed 50 characters']
  }],
  subscriptionTier: {
    type: String,
    enum: ['free', 'basic', 'pro', 'enterprise'],
    default: 'free'
  },
  subscriptionDetails: {
    planId: String,
    customerId: String,
    subscriptionId: String,
    status: {
      type: String,
      enum: ['active', 'canceled', 'past_due', 'trialing', 'incomplete'],
      default: 'active'
    },
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false
    },
    trialStart: Date,
    trialEnd: Date
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  onboardingSteps: {
    profileSetup: {
      type: Boolean,
      default: false
    },
    businessInfo: {
      type: Boolean,
      default: false
    },
    goals: {
      type: Boolean,
      default: false
    },
    integrations: {
      type: Boolean,
      default: false
    },
    welcome: {
      type: Boolean,
      default: false
    }
  },
  settings: {
    emailNotifications: {
      marketing: {
        type: Boolean,
        default: false
      },
      productUpdates: {
        type: Boolean,
        default: true
      },
      securityAlerts: {
        type: Boolean,
        default: true
      },
      weeklyDigest: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private', 'contacts'],
        default: 'private'
      },
      allowAnalytics: {
        type: Boolean,
        default: true
      }
    },
    dashboard: {
      layout: {
        type: String,
        enum: ['default', 'compact', 'detailed'],
        default: 'default'
      },
      widgets: [{
        type: String,
        position: Number,
        visible: {
          type: Boolean,
          default: true
        }
      }]
    }
  },
  analytics: {
    profileViews: {
      type: Number,
      default: 0
    },
    lastProfileUpdate: Date,
    completionScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance (userId index already created by unique: true)
profileSchema.index({ businessName: 'text', industry: 'text' });
profileSchema.index({ subscriptionTier: 1 });
profileSchema.index({ createdAt: -1 });

// Virtual for full name
profileSchema.virtual('displayName').get(function() {
  return this.fullName || `${this.firstName} ${this.lastName}`.trim();
});

// Pre-save middleware to update full name and completion score
profileSchema.pre('save', function(next) {
  // Update full name if not provided
  if (!this.fullName) {
    this.fullName = `${this.firstName} ${this.lastName}`.trim();
  }

  // Calculate profile completion score
  this.analytics.completionScore = this.calculateCompletionScore();
  
  // Update last profile update
  if (this.isModified() && !this.isNew) {
    this.analytics.lastProfileUpdate = new Date();
  }

  next();
});

// Method to calculate profile completion score
profileSchema.methods.calculateCompletionScore = function() {
  let score = 0;
  const fields = [
    'firstName', 'lastName', 'businessName', 'businessType',
    'industry', 'teamSize', 'primaryGoal', 'experienceLevel',
    'monthlyRevenue', 'location.country', 'location.city'
  ];

  fields.forEach(field => {
    const value = field.includes('.') 
      ? field.split('.').reduce((obj, key) => obj?.[key], this)
      : this[field];
    
    if (value && value.toString().trim()) {
      score += Math.floor(100 / fields.length);
    }
  });

  // Bonus points for optional fields
  if (this.avatar) score += 5;
  if (this.currentTools && this.currentTools.length > 0) score += 5;
  if (this.tags && this.tags.length > 0) score += 5;

  return Math.min(score, 100);
};

// Method to check if profile is complete for onboarding
profileSchema.methods.isProfileComplete = function() {
  const requiredFields = [
    'firstName', 'lastName', 'businessName', 'businessType',
    'industry', 'teamSize', 'primaryGoal'
  ];

  return requiredFields.every(field => {
    const value = this[field];
    return value && value.toString().trim();
  });
};

// Method to update onboarding step
profileSchema.methods.completeOnboardingStep = function(step) {
  if (this.onboardingSteps.hasOwnProperty(step)) {
    this.onboardingSteps[step] = true;
    
    // Check if all steps are completed
    const allSteps = Object.values(this.onboardingSteps);
    this.onboardingCompleted = allSteps.every(step => step === true);
  }
  
  return this.save();
};

// Method to get subscription info
profileSchema.methods.getSubscriptionInfo = function() {
  return {
    tier: this.subscriptionTier,
    status: this.subscriptionDetails?.status || 'active',
    isActive: this.subscriptionDetails?.status === 'active',
    currentPeriodEnd: this.subscriptionDetails?.currentPeriodEnd,
    cancelAtPeriodEnd: this.subscriptionDetails?.cancelAtPeriodEnd || false
  };
};

// Static method to find profiles by business type
profileSchema.statics.findByBusinessType = function(businessType) {
  return this.find({ businessType });
};

// Static method to find profiles by industry
profileSchema.statics.findByIndustry = function(industry) {
  return this.find({ industry: new RegExp(industry, 'i') });
};

// Static method to find profiles by subscription tier
profileSchema.statics.findBySubscriptionTier = function(tier) {
  return this.find({ subscriptionTier: tier });
};

export default mongoose.model('Profile', profileSchema); 