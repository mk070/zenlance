import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
  // Link to Lead
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true
  },
  proposalNumber: {
    type: String,
    unique: true,
    trim: true
  },
  
  // Client Information (cached from lead)
  clientInfo: {
    name: String,
    email: String,
    company: String,
    jobTitle: String
  },
  
  // Proposal Content
  content: {
    title: String,
    executiveSummary: String,
    clientInfo: {
      name: String,
      company: String,
      email: String,
      project: String
    },
    projectOverview: {
      description: String,
      objectives: [String],
      scope: String,
      requirements: String
    },
    solution: {
      approach: String,
      methodology: String,
      techStack: [String],
      deliverables: [String]
    },
    timeline: {
      duration: String,
      phases: [{
        name: String,
        duration: String,
        description: String
      }]
    },
    investment: {
      totalAmount: Number,
      currency: { type: String, default: 'USD' },
      breakdown: [{
        item: String,
        amount: Number,
        description: String
      }],
      paymentSchedule: String
    },
    whyChooseUs: [String],
    termsAndConditions: [String],
    nextSteps: [String]
  },
  
  // Generation Details
  generatedContent: {
    type: String, // Full AI-generated content
    required: true
  },
  generationParams: {
    formatType: {
      type: String,
      enum: ['professional', 'creative', 'technical', 'simple'],
      default: 'professional'
    },
    tone: {
      type: String,
      enum: ['professional', 'formal', 'friendly', 'confident', 'consultative'],
      default: 'professional'
    },
    customInstructions: String
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'generated', 'sent', 'viewed', 'accepted', 'rejected'],
    default: 'draft'
  },
  
  // File Information
  pdfUrl: String,
  pdfFileName: String,
  
  // Email Tracking
  sentDate: Date,
  sentTo: [String],
  viewedDate: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Creation Details
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
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

// Generate proposal number
proposalSchema.pre('save', async function(next) {
  if (!this.proposalNumber) {
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
    this.proposalNumber = `PROP-${year}${month}-${sequential}`;
  }
  next();
});

// Virtual for proposal URL
proposalSchema.virtual('proposalUrl').get(function() {
  return `/proposals/${this._id}`;
});

const Proposal = mongoose.model('Proposal', proposalSchema);

export default Proposal; 