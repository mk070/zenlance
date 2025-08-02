import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
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
      /^[\+]?[0-9\s\-\(\)]{10,}$/,
      'Please enter a valid phone number'
    ]
  },
  
  // Business Information
  company: {
    type: String,
    required: [true, 'Company name is required'],
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
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'Unknown'],
    default: 'Unknown'
  },
  
  // Contact Information
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  website: {
    type: String,
    trim: true,
    match: [
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
      'Please enter a valid website URL'
    ]
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String
  },
  
  // Client Status & Classification
  status: {
    type: String,
    required: [true, 'Client status is required'],
    enum: ['Active', 'Inactive', 'Potential', 'Former', 'Blacklisted'],
    default: 'Active'
  },
  type: {
    type: String,
    enum: ['Individual', 'Small Business', 'Enterprise', 'Agency', 'Non-Profit'],
    default: 'Small Business'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'VIP'],
    default: 'Medium'
  },
  
  // Business Relationship
  relationshipManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  acquisitionDate: {
    type: Date,
    default: Date.now
  },
  acquisitionSource: {
    type: String,
    enum: [
      'Referral', 'Website', 'Social Media', 'Cold Outreach',
      'Networking', 'Previous Client', 'Marketing Campaign',
      'Trade Show', 'Converted Lead', 'Other'
    ]
  },
  
  // Financial Information
  billingDetails: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'Other']
    },
    paymentTerms: {
      type: String,
      enum: ['Net 15', 'Net 30', 'Net 60', 'Net 90', 'Due on Receipt', 'Custom'],
      default: 'Net 30'
    },
    creditLimit: {
      type: Number,
      min: 0,
      default: 0
    },
    taxId: String,
    billingEmail: String,
    invoiceDeliveryMethod: {
      type: String,
      enum: ['Email', 'Mail', 'Portal', 'Both'],
      default: 'Email'
    }
  },
  
  // Project & Service History
  projects: [{
    name: {
      type: String,
      required: true,
      maxlength: [100, 'Project name cannot exceed 100 characters']
    },
    description: String,
    startDate: Date,
    endDate: Date,
    status: {
      type: String,
      enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'],
      default: 'Planning'
    },
    value: {
      type: Number,
      min: 0
    },
    projectManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tags: [String]
  }],
  
  // Financial Metrics
  financialMetrics: {
    totalRevenue: {
      type: Number,
      default: 0,
      min: 0
    },
    lastInvoiceDate: Date,
    lastPaymentDate: Date,
    outstandingBalance: {
      type: Number,
      default: 0
    },
    averageProjectValue: {
      type: Number,
      default: 0,
      min: 0
    },
    lifetimeValue: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  // Communication & Notes
  notes: [{
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    type: {
      type: String,
      enum: ['General', 'Meeting', 'Phone Call', 'Email', 'Important', 'Warning'],
      default: 'General'
    },
    isPrivate: {
      type: Boolean,
      default: false
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
  
  // Communication Preferences
  communicationPreferences: {
    preferredMethod: {
      type: String,
      enum: ['Email', 'Phone', 'SMS', 'Slack', 'Teams', 'Other'],
      default: 'Email'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    bestTimeToContact: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Anytime'],
      default: 'Anytime'
    },
    frequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'As Needed'],
      default: 'As Needed'
    }
  },
  
  // Contract & Legal
  contracts: [{
    name: String,
    startDate: Date,
    endDate: Date,
    value: Number,
    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Signed', 'Active', 'Expired', 'Terminated'],
      default: 'Draft'
    },
    renewalDate: Date,
    autoRenewal: {
      type: Boolean,
      default: false
    },
    terms: String,
    documentPath: String
  }],
  
  // Lead Conversion (if converted from lead)
  convertedFromLead: {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead'
    },
    conversionDate: Date,
    conversionValue: Number
  },
  
  // Tags and Categories
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  categories: [{
    type: String,
    enum: ['VIP', 'High Value', 'Long Term', 'Recurring', 'One-time', 'Strategic Partner']
  }],
  
  // System fields
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastInteractionDate: Date,
  nextReviewDate: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
clientSchema.index({ relationshipManager: 1, status: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ company: 1 });
clientSchema.index({ createdAt: -1 });
clientSchema.index({ nextReviewDate: 1 });
clientSchema.index({ 'financialMetrics.totalRevenue': -1 });
clientSchema.index({ 'relationshipManager': 1, 'isActive': 1 });
clientSchema.index({ acquisitionDate: -1 });

// Compound indexes for common queries
clientSchema.index({ 
  relationshipManager: 1, 
  status: 1, 
  priority: 1, 
  createdAt: -1 
});

clientSchema.index({
  status: 1,
  priority: 1,
  'financialMetrics.totalRevenue': -1
});

// Virtual for full name
clientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for full address
clientSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  if (!addr || !addr.street) return null;
  
  return [
    addr.street,
    addr.city,
    addr.state,
    addr.zipCode,
    addr.country
  ].filter(Boolean).join(', ');
});

// Virtual for days since acquisition
clientSchema.virtual('daysSinceAcquisition').get(function() {
  return Math.floor((Date.now() - this.acquisitionDate) / (1000 * 60 * 60 * 24));
});

// Virtual for active projects count
clientSchema.virtual('activeProjectsCount').get(function() {
  return this.projects.filter(p => p.status === 'Active').length;
});

// Virtual for project success rate
clientSchema.virtual('projectSuccessRate').get(function() {
  const completed = this.projects.filter(p => p.status === 'Completed').length;
  const total = this.projects.filter(p => p.status !== 'Planning').length;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
});

// Pre-save middleware
clientSchema.pre('save', function(next) {
  // Update financial metrics
  this.calculateFinancialMetrics();
  
  // Update last interaction date when notes are added
  if (this.notes && this.notes.length > 0) {
    const latestNote = this.notes[this.notes.length - 1];
    if (latestNote.createdAt > this.lastInteractionDate || !this.lastInteractionDate) {
      this.lastInteractionDate = latestNote.createdAt;
    }
  }
  
  next();
});

// Instance Methods
clientSchema.methods.calculateFinancialMetrics = function() {
  const completedProjects = this.projects.filter(p => p.status === 'Completed' && p.value);
  
  if (completedProjects.length > 0) {
    // Calculate total revenue
    this.financialMetrics.totalRevenue = completedProjects.reduce((sum, project) => sum + project.value, 0);
    
    // Calculate average project value
    this.financialMetrics.averageProjectValue = this.financialMetrics.totalRevenue / completedProjects.length;
    
    // Lifetime value (same as total revenue for now, but could include future projections)
    this.financialMetrics.lifetimeValue = this.financialMetrics.totalRevenue;
  }
};

clientSchema.methods.addNote = function(content, userId, type = 'General', isPrivate = false) {
  this.notes.push({
    content,
    type,
    isPrivate,
    createdBy: userId,
    createdAt: new Date()
  });
  
  this.lastInteractionDate = new Date();
  return this.save();
};

clientSchema.methods.addProject = function(projectData, userId) {
  const project = {
    ...projectData,
    projectManager: userId,
    startDate: projectData.startDate || new Date()
  };
  
  this.projects.push(project);
  return this.save();
};

clientSchema.methods.updateProject = function(projectId, updateData) {
  const project = this.projects.id(projectId);
  if (!project) {
    throw new Error('Project not found');
  }
  
  Object.assign(project, updateData);
  return this.save();
};

clientSchema.methods.addContract = function(contractData) {
  this.contracts.push(contractData);
  return this.save();
};

clientSchema.methods.updateStatus = function(newStatus, userId) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Add automatic note for status change
  this.notes.push({
    content: `Client status changed from ${oldStatus} to ${newStatus}`,
    type: 'Important',
    createdBy: userId,
    createdAt: new Date()
  });
  
  return this.save();
};

clientSchema.methods.getProjectHistory = function() {
  return this.projects.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
};

clientSchema.methods.getRecentNotes = function(limit = 5) {
  return this.notes
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
};

// Static Methods
clientSchema.statics.findByManager = function(userId, options = {}) {
  const query = { relationshipManager: userId, isActive: true };
  
  if (options.status) query.status = options.status;
  if (options.priority) query.priority = options.priority;
  if (options.type) query.type = options.type;
  
  return this.find(query)
    .populate('relationshipManager', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .sort(options.sort || { createdAt: -1 });
};

clientSchema.statics.getHighValueClients = function(userId, minValue = 10000) {
  return this.find({
    relationshipManager: userId,
    isActive: true,
    'financialMetrics.totalRevenue': { $gte: minValue }
  })
  .populate('relationshipManager', 'firstName lastName email')
  .sort({ 'financialMetrics.totalRevenue': -1 });
};

clientSchema.statics.getClientsForReview = function(userId) {
  return this.find({
    relationshipManager: userId,
    isActive: true,
    nextReviewDate: { $lte: new Date() }
  })
  .populate('relationshipManager', 'firstName lastName email')
  .sort({ nextReviewDate: 1 });
};

clientSchema.statics.getClientStatistics = function(userId, dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);
  
  return this.aggregate([
    {
      $match: {
        relationshipManager: new mongoose.Types.ObjectId(userId),
        acquisitionDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$financialMetrics.totalRevenue' },
        avgRevenue: { $avg: '$financialMetrics.totalRevenue' }
      }
    }
  ]);
};

clientSchema.statics.getRevenueByMonth = function(userId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  return this.aggregate([
    {
      $match: {
        relationshipManager: new mongoose.Types.ObjectId(userId),
        'projects.endDate': { $gte: startDate },
        'projects.status': 'Completed'
      }
    },
    {
      $unwind: '$projects'
    },
    {
      $match: {
        'projects.status': 'Completed',
        'projects.endDate': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$projects.endDate' },
          month: { $month: '$projects.endDate' }
        },
        revenue: { $sum: '$projects.value' },
        projectCount: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

const Client = mongoose.model('Client', clientSchema);

export default Client; 