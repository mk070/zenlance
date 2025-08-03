import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  // Basic Information
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
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email address'
    ]
  },
  phone: {
    type: String,
    trim: true,
    match: [
      /^[\+]?[0-9\s\-\(\)]{3,}$/,
      'Phone number must be at least 3 characters'
    ]
  },
  
  // Business Information
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  jobTitle: {
    type: String,
    trim: true,
    maxlength: [80, 'Job title cannot exceed 80 characters']
  },
  industry: {
    type: String,
    trim: true,
    enum: [
      'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
      'Manufacturing', 'Real Estate', 'Legal', 'Marketing', 'Consulting',
      'Non-Profit', 'Government', 'Entertainment', 'Food & Beverage',
      'Travel & Tourism', 'Automotive', 'Construction', 'Energy',
      'Telecommunications', 'Other'
    ]
  },
  
  // Lead Details
  source: {
    type: String,
    required: [true, 'Lead source is required'],
    enum: [
      'Website', 'Social Media', 'Email Campaign', 'Referral',
      'Cold Call', 'LinkedIn', 'Google Ads', 'Facebook Ads',
      'Trade Show', 'Webinar', 'Content Marketing', 'SEO',
      'Word of Mouth', 'Direct Mail', 'Other'
    ]
  },
  status: {
    type: String,
    required: [true, 'Lead status is required'],
    enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    default: 'New'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  
  // Project Information
  projectType: {
    type: String,
    trim: true,
    maxlength: [100, 'Project type cannot exceed 100 characters']
  },
  budget: {
    min: {
      type: Number,
      min: [0, 'Budget cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Budget cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'Other']
    }
  },
  timeline: {
    startDate: Date,
    endDate: Date,
    urgency: {
      type: String,
      enum: ['Flexible', 'Soon', 'ASAP', 'Specific Date'],
      default: 'Flexible'
    }
  },
  
  // Communication & Notes
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  notes: [{
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // Communication History
  communications: [{
    type: {
      type: String,
      enum: ['Email', 'Phone', 'Meeting', 'LinkedIn', 'Other'],
      required: true
    },
    subject: String,
    content: {
      type: String,
      maxlength: [1000, 'Communication content cannot exceed 1000 characters']
    },
    outcome: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative', 'No Response'],
      default: 'Neutral'
    },
    nextFollowUp: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  
  // Scoring & Qualification
  leadScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  qualificationCriteria: {
    budget: {
      type: Boolean,
      default: false
    },
    authority: {
      type: Boolean,
      default: false
    },
    need: {
      type: Boolean,
      default: false
    },
    timeline: {
      type: Boolean,
      default: false
    }
  },
  
  // Assignment & Ownership
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Tracking & Analytics
  lastContactDate: Date,
  nextFollowUpDate: Date,
  convertedToClient: {
    type: Boolean,
    default: false
  },
  convertedAt: Date,
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  
  // Tags for organization
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ email: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ nextFollowUpDate: 1 });
leadSchema.index({ leadScore: -1 });
leadSchema.index({ 'assignedTo': 1, 'isActive': 1 });

// Compound index for common queries
leadSchema.index({ 
  assignedTo: 1, 
  status: 1, 
  priority: 1, 
  createdAt: -1 
});

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for days since created
leadSchema.virtual('daysSinceCreated').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for days since last contact
leadSchema.virtual('daysSinceLastContact').get(function() {
  if (!this.lastContactDate) return null;
  return Math.floor((Date.now() - this.lastContactDate) / (1000 * 60 * 60 * 24));
});

// Virtual for qualification score
leadSchema.virtual('qualificationScore').get(function() {
  const criteria = this.qualificationCriteria;
  const total = Object.values(criteria).filter(Boolean).length;
  return Math.round((total / 4) * 100);
});

// Pre-save middleware
leadSchema.pre('save', function(next) {
  // Update lastContactDate when communications are added
  if (this.communications && this.communications.length > 0) {
    const latestComm = this.communications[this.communications.length - 1];
    if (latestComm.createdAt > this.lastContactDate || !this.lastContactDate) {
      this.lastContactDate = latestComm.createdAt;
    }
  }
  
  // Auto-calculate lead score based on various factors
  this.calculateLeadScore();
  
  next();
});

// Instance Methods
leadSchema.methods.calculateLeadScore = function() {
  let score = 50; // Base score
  
  // Budget factor (0-25 points)
  if (this.budget?.min) {
    if (this.budget.min >= 10000) score += 25;
    else if (this.budget.min >= 5000) score += 15;
    else if (this.budget.min >= 1000) score += 10;
    else score += 5;
  }
  
  // Engagement factor (0-20 points)
  const commCount = this.communications?.length || 0;
  score += Math.min(commCount * 5, 20);
  
  // Qualification factor (0-20 points)
  score += this.qualificationScore * 0.2;
  
  // Urgency factor (0-15 points)
  if (this.timeline?.urgency === 'ASAP') score += 15;
  else if (this.timeline?.urgency === 'Soon') score += 10;
  else if (this.timeline?.urgency === 'Specific Date') score += 8;
  
  // Company factor (0-10 points)
  if (this.company) score += 5;
  if (this.jobTitle) score += 5;
  
  // Recency factor (-10 to +10 points)
  const daysSince = this.daysSinceCreated;
  if (daysSince <= 7) score += 10;
  else if (daysSince <= 30) score += 5;
  else if (daysSince > 90) score -= 10;
  
  this.leadScore = Math.max(0, Math.min(100, Math.round(score)));
};

leadSchema.methods.addNote = function(content, userId) {
  this.notes.push({
    content,
    createdBy: userId,
    createdAt: new Date()
  });
  return this.save();
};

leadSchema.methods.addCommunication = function(communicationData, userId) {
  const communication = {
    ...communicationData,
    createdBy: userId,
    createdAt: new Date()
  };
  
  this.communications.push(communication);
  
  // Update last contact date
  this.lastContactDate = communication.createdAt;
  
  // Set next follow-up if provided
  if (communication.nextFollowUp) {
    this.nextFollowUpDate = communication.nextFollowUp;
  }
  
  return this.save();
};

leadSchema.methods.convertToClient = function() {
  this.convertedToClient = true;
  this.convertedAt = new Date();
  this.status = 'Won';
  return this.save();
};

leadSchema.methods.updateStatus = function(newStatus, userId) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add automatic note for status change
  this.notes.push({
    content: `Status changed from ${oldStatus} to ${newStatus}`,
    createdBy: userId,
    createdAt: new Date()
  });
  
  return this.save();
};

// Static Methods
leadSchema.statics.findByAssignee = function(userId, options = {}) {
  const query = { assignedTo: userId, isActive: true };
  
  if (options.status) query.status = options.status;
  if (options.priority) query.priority = options.priority;
  
  return this.find(query)
    .populate('assignedTo', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .sort(options.sort || { createdAt: -1 });
};

leadSchema.statics.getLeadsRequiringFollowUp = function(userId) {
  return this.find({
    assignedTo: userId,
    isActive: true,
    nextFollowUpDate: { $lte: new Date() },
    status: { $nin: ['Won', 'Lost'] }
  })
  .populate('assignedTo', 'firstName lastName email')
  .sort({ nextFollowUpDate: 1 });
};

leadSchema.statics.getLeadStatistics = function(userId, dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);
  
  return this.aggregate([
    {
      $match: {
        assignedTo: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgScore: { $avg: '$leadScore' },
        totalBudget: {
          $sum: {
            $cond: [
              { $gt: ['$budget.min', 0] },
              '$budget.min',
              0
            ]
          }
        }
      }
    }
  ]);
};

const Lead = mongoose.model('Lead', leadSchema);

export default Lead; 