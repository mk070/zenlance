import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Milestone name is required'],
    trim: true,
    maxlength: [200, 'Milestone name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  amount: {
    type: Number,
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'approved', 'paid'],
    default: 'pending'
  },
  completedDate: Date,
  approvedDate: Date,
  approvedBy: {
    name: String,
    email: String
  },
  deliverables: [{
    name: String,
    description: String,
    fileUrl: String,
    uploadedAt: Date
  }],
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const contractSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Contract title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Contract content is required']
  },
  template: {
    type: String,
    enum: ['standard', 'nda', 'service', 'custom'],
    default: 'standard'
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'signed', 'rejected', 'expired'],
    default: 'draft'
  },
  validUntil: Date,
  
  // Digital Signature Information
  signatures: [{
    party: {
      type: String,
      enum: ['client', 'contractor'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    signedAt: Date,
    signatureData: String, // Base64 encoded signature image
    ipAddress: String,
    userAgent: String
  }],
  
  requiresClientSignature: {
    type: Boolean,
    default: true
  },
  requiresContractorSignature: {
    type: Boolean,
    default: true
  },
  
  // Contract tracking
  sentDate: Date,
  sentTo: [String],
  viewedDate: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  
  // File information
  pdfUrl: String,
  documentUrl: String
}, {
  timestamps: true
});

const projectSchema = new mongoose.Schema({
  // Basic Information
  projectNumber: {
    type: String,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [200, 'Project name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    enum: ['web_development', 'mobile_app', 'design', 'consulting', 'marketing', 'other'],
    default: 'other'
  },
  
  // Client Information
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client is required']
  },
  clientName: {
    type: String,
    required: true
  },
  clientEmail: {
    type: String,
    required: true
  },
  
  // Project Timeline
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  actualStartDate: Date,
  actualEndDate: Date,
  
  // Status and Progress
  status: {
    type: String,
    enum: ['draft', 'proposal', 'contracted', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    default: 'draft'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Financial Information
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: [0, 'Budget cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY']
  },
  billingType: {
    type: String,
    enum: ['fixed', 'hourly', 'milestone', 'retainer'],
    default: 'fixed'
  },
  hourlyRate: {
    type: Number,
    min: [0, 'Hourly rate cannot be negative']
  },
  estimatedHours: {
    type: Number,
    min: [0, 'Estimated hours cannot be negative']
  },
  actualHours: {
    type: Number,
    default: 0,
    min: [0, 'Actual hours cannot be negative']
  },
  
  // Contract Information
  contract: contractSchema,
  hasContract: {
    type: Boolean,
    default: false
  },
  
  // Milestones
  milestones: [milestoneSchema],
  
  // Quote/Invoice References
  quoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quote'
  },
  invoiceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }],
  
  // Team Members
  team: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['project_manager', 'developer', 'designer', 'consultant', 'other'],
      default: 'other'
    },
    assignedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notes and Files
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  files: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Task Management (Basic)
  tasks: [{
    title: String,
    description: String,
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    completedDate: Date
  }],
  
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
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
projectSchema.index({ clientId: 1, status: 1 });
projectSchema.index({ createdBy: 1, status: 1 });
projectSchema.index({ startDate: 1, endDate: 1 });
projectSchema.index({ 'milestones.dueDate': 1 });

// Virtuals
projectSchema.virtual('duration').get(function() {
  if (!this.startDate || !this.endDate) return null;
  const diffTime = this.endDate - this.startDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

projectSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  return new Date() > this.endDate && this.progress < 100;
});

projectSchema.virtual('totalMilestoneAmount').get(function() {
  return this.milestones.reduce((sum, milestone) => sum + (milestone.amount || 0), 0);
});

projectSchema.virtual('completedMilestoneAmount').get(function() {
  return this.milestones
    .filter(m => ['completed', 'approved', 'paid'].includes(m.status))
    .reduce((sum, milestone) => sum + (milestone.amount || 0), 0);
});

projectSchema.virtual('contractSigned').get(function() {
  if (!this.contract) return false;
  return this.contract.status === 'signed';
});

// Pre-save middleware
projectSchema.pre('save', async function(next) {
  // Generate project number if not provided
  if (!this.projectNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdBy: this.createdBy,
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    const sequential = (count + 1).toString().padStart(3, '0');
    this.projectNumber = `PRJ-${year}${month}-${sequential}`;
  }

  // Update progress based on milestones
  if (this.milestones && this.milestones.length > 0) {
    const completedMilestones = this.milestones.filter(m => 
      ['completed', 'approved', 'paid'].includes(m.status)
    ).length;
    this.progress = Math.round((completedMilestones / this.milestones.length) * 100);
  }

  // Update hasContract flag
  this.hasContract = !!this.contract && this.contract.status !== 'draft';

  next();
});

// Instance Methods
projectSchema.methods.updateProgress = function() {
  if (this.milestones && this.milestones.length > 0) {
    const completedMilestones = this.milestones.filter(m => 
      ['completed', 'approved', 'paid'].includes(m.status)
    ).length;
    this.progress = Math.round((completedMilestones / this.milestones.length) * 100);
  }
  return this.save();
};

projectSchema.methods.addMilestone = function(milestoneData) {
  this.milestones.push(milestoneData);
  return this.save();
};

projectSchema.methods.updateMilestoneStatus = function(milestoneId, status, additionalData = {}) {
  const milestone = this.milestones.id(milestoneId);
  if (!milestone) {
    throw new Error('Milestone not found');
  }
  
  milestone.status = status;
  if (status === 'completed') {
    milestone.completedDate = new Date();
  }
  if (status === 'approved' && additionalData.approvedBy) {
    milestone.approvedDate = new Date();
    milestone.approvedBy = additionalData.approvedBy;
  }
  
  Object.assign(milestone, additionalData);
  return this.save();
};

projectSchema.methods.signContract = function(signatureData) {
  if (!this.contract) {
    throw new Error('No contract associated with this project');
  }
  
  this.contract.signatures.push(signatureData);
  
  // Check if all required signatures are collected
  const hasClientSignature = this.contract.signatures.some(s => s.party === 'client');
  const hasContractorSignature = this.contract.signatures.some(s => s.party === 'contractor');
  
  if (
    (!this.contract.requiresClientSignature || hasClientSignature) &&
    (!this.contract.requiresContractorSignature || hasContractorSignature)
  ) {
    this.contract.status = 'signed';
    if (this.status === 'proposal') {
      this.status = 'contracted';
    }
  }
  
  return this.save();
};

projectSchema.methods.addNote = function(content, userId) {
  this.notes.push({
    content,
    createdBy: userId,
    createdAt: new Date()
  });
  return this.save();
};

projectSchema.methods.addFile = function(fileData) {
  this.files.push({
    ...fileData,
    uploadedAt: new Date()
  });
  return this.save();
};

// Static Methods
projectSchema.statics.findByUser = function(userId, options = {}) {
  const query = { createdBy: userId, isActive: true };

  if (options.status) query.status = options.status;
  if (options.clientId) query.clientId = options.clientId;
  if (options.priority) query.priority = options.priority;
  
  if (options.dateFrom || options.dateTo) {
    query.startDate = {};
    if (options.dateFrom) query.startDate.$gte = new Date(options.dateFrom);
    if (options.dateTo) query.startDate.$lte = new Date(options.dateTo);
  }

  return this.find(query)
    .populate('clientId', 'firstName lastName company email')
    .populate('quoteId', 'quoteNumber total status')
    .populate('team.userId', 'firstName lastName email')
    .sort(options.sort || { createdAt: -1 });
};

projectSchema.statics.getActiveProjects = function(userId) {
  return this.find({
    createdBy: userId,
    isActive: true,
    status: { $in: ['contracted', 'in_progress'] }
  })
  .populate('clientId', 'firstName lastName company')
  .sort({ priority: -1, startDate: 1 });
};

projectSchema.statics.getOverdueProjects = function(userId) {
  const today = new Date();
  return this.find({
    createdBy: userId,
    isActive: true,
    status: { $in: ['contracted', 'in_progress'] },
    endDate: { $lt: today },
    progress: { $lt: 100 }
  })
  .populate('clientId', 'firstName lastName company')
  .sort({ endDate: 1 });
};

projectSchema.statics.getUpcomingMilestones = function(userId, days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(userId),
        isActive: true,
        status: { $in: ['contracted', 'in_progress'] }
      }
    },
    { $unwind: '$milestones' },
    {
      $match: {
        'milestones.status': { $in: ['pending', 'in_progress'] },
        'milestones.dueDate': {
          $gte: new Date(),
          $lte: futureDate
        }
      }
    },
    {
      $lookup: {
        from: 'clients',
        localField: 'clientId',
        foreignField: '_id',
        as: 'client'
      }
    },
    { $unwind: '$client' },
    {
      $project: {
        projectNumber: 1,
        projectName: '$name',
        clientName: { $concat: ['$client.firstName', ' ', '$client.lastName'] },
        milestone: '$milestones',
        daysUntilDue: {
          $divide: [
            { $subtract: ['$milestones.dueDate', new Date()] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    { $sort: { 'milestone.dueDate': 1 } }
  ]);
};

projectSchema.statics.getProjectStatistics = function(userId) {
  return this.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(userId),
        isActive: true
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget' },
        avgProgress: { $avg: '$progress' }
      }
    }
  ]);
};

const Project = mongoose.model('Project', projectSchema);

export default Project;