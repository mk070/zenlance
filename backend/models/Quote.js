import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
  // Basic Information
  quoteNumber: {
    type: String,
    required: [true, 'Quote number is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Quote number cannot exceed 50 characters']
  },
  title: {
    type: String,
    required: [true, 'Quote title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
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
  clientAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },

  // Quote Details
  issueDate: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: [true, 'Valid until date is required']
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
    default: 'draft'
  },
  template: {
    type: String,
    enum: ['modern', 'classic', 'minimal', 'corporate', 'creative'],
    default: 'modern'
  },

  // Financial Information
  items: [{
    itemType: {
      type: String,
      enum: ['service', 'product', 'hour', 'fixed'],
      default: 'service'
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [200, 'Item name cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Item description cannot exceed 500 characters']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    unit: {
      type: String,
      enum: ['hour', 'day', 'week', 'month', 'piece', 'project'],
      default: 'piece'
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: [0, 'Rate cannot be negative']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    isOptional: {
      type: Boolean,
      default: false
    }
  }],

  // Pricing Options (for flexibility)
  pricingOptions: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    items: [String], // References to item IDs
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    isRecommended: {
      type: Boolean,
      default: false
    }
  }],

  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative'],
    max: [100, 'Tax cannot exceed 100%']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  total: {
    type: Number,
    required: [true, 'Total is required'],
    min: [0, 'Total cannot be negative']
  },

  // Currency
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY']
  },

  // Additional Information
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  termsAndConditions: {
    type: String,
    trim: true,
    maxlength: [2000, 'Terms and conditions cannot exceed 2000 characters']
  },

  // Acceptance Information
  acceptedDate: Date,
  acceptedBy: {
    name: String,
    email: String,
    ipAddress: String
  },
  rejectionReason: String,

  // Conversion Tracking
  convertedToInvoice: {
    type: Boolean,
    default: false
  },
  invoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  },
  convertedToProject: {
    type: Boolean,
    default: false
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },

  // Tracking Information
  sentDate: Date,
  sentTo: [String], // Array of email addresses
  viewedDate: Date,
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },

  // File Information
  pdfUrl: String,
  pdfGenerated: {
    type: Boolean,
    default: false
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Performance indexes (removing duplicate quoteNumber index since unique: true already creates one)
quoteSchema.index({ clientId: 1, status: 1 });
quoteSchema.index({ createdBy: 1, status: 1 });
quoteSchema.index({ validUntil: 1, status: 1 });
quoteSchema.index({ issueDate: -1 });

// Virtual for days until expiry
quoteSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.validUntil) return null;
  const today = new Date();
  const expiry = new Date(this.validUntil);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is expired
quoteSchema.virtual('isExpired').get(function() {
  if (this.status === 'accepted' || this.status === 'rejected') return false;
  return this.daysUntilExpiry < 0;
});

// Pre-save middleware
quoteSchema.pre('save', async function(next) {
  // Generate quote number if not provided
  if (!this.quoteNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments({
      createdBy: this.createdBy,
      issueDate: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lt: new Date(date.getFullYear(), date.getMonth() + 1, 1)
      }
    });
    const sequential = (count + 1).toString().padStart(3, '0');
    this.quoteNumber = `QT-${year}${month}-${sequential}`;
  }

  // Calculate amounts
  this.calculateAmounts();

  // Update status based on validity date
  if (this.status === 'sent' && this.validUntil && new Date() > this.validUntil) {
    this.status = 'expired';
  }

  // Set validity date if not provided (30 days from issue date)
  if (!this.validUntil) {
    this.validUntil = new Date(this.issueDate);
    this.validUntil.setDate(this.validUntil.getDate() + 30);
  }

  next();
});

// Instance Methods
quoteSchema.methods.calculateAmounts = function() {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => {
    if (!item.isOptional) {
      item.amount = item.quantity * item.rate;
      return sum + item.amount;
    }
    return sum;
  }, 0);

  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.tax) / 100;

  // Calculate discount amount
  this.discountAmount = (this.subtotal * this.discount) / 100;

  // Calculate total
  this.total = this.subtotal + this.taxAmount - this.discountAmount;

  // Update pricing options totals
  if (this.pricingOptions && this.pricingOptions.length > 0) {
    this.pricingOptions.forEach(option => {
      const optionItems = this.items.filter(item => 
        option.items.includes(item._id.toString())
      );
      option.totalAmount = optionItems.reduce((sum, item) => {
        return sum + (item.quantity * item.rate);
      }, 0);
    });
  }
};

quoteSchema.methods.markAsSent = function(recipients = []) {
  this.status = 'sent';
  this.sentDate = new Date();
  if (recipients.length > 0) {
    this.sentTo = recipients;
  }
  return this.save();
};

quoteSchema.methods.markAsViewed = function() {
  if (this.status === 'sent') {
    this.status = 'viewed';
  }
  this.viewedDate = new Date();
  this.viewCount += 1;
  return this.save();
};

quoteSchema.methods.accept = function(acceptanceData) {
  this.status = 'accepted';
  this.acceptedDate = new Date();
  if (acceptanceData) {
    this.acceptedBy = acceptanceData;
  }
  return this.save();
};

quoteSchema.methods.reject = function(reason) {
  this.status = 'rejected';
  if (reason) {
    this.rejectionReason = reason;
  }
  return this.save();
};

quoteSchema.methods.convertToInvoice = async function() {
  const Invoice = mongoose.model('Invoice');
  
  const invoiceData = {
    title: this.title,
    description: this.description,
    clientId: this.clientId,
    clientName: this.clientName,
    clientEmail: this.clientEmail,
    clientAddress: this.clientAddress,
    items: this.items.filter(item => !item.isOptional).map(item => ({
      description: item.name,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount
    })),
    subtotal: this.subtotal,
    tax: this.tax,
    taxAmount: this.taxAmount,
    discount: this.discount,
    discountAmount: this.discountAmount,
    total: this.total,
    currency: this.currency,
    notes: this.notes,
    termsAndConditions: this.termsAndConditions,
    createdBy: this.createdBy
  };

  const invoice = new Invoice(invoiceData);
  await invoice.save();

  this.convertedToInvoice = true;
  this.invoiceId = invoice._id;
  await this.save();

  return invoice;
};

quoteSchema.methods.duplicate = function() {
  const duplicateData = this.toObject();
  delete duplicateData._id;
  delete duplicateData.quoteNumber;
  delete duplicateData.sentDate;
  delete duplicateData.sentTo;
  delete duplicateData.viewedDate;
  delete duplicateData.viewCount;
  delete duplicateData.downloadCount;
  delete duplicateData.acceptedDate;
  delete duplicateData.acceptedBy;
  delete duplicateData.rejectionReason;
  delete duplicateData.createdAt;
  delete duplicateData.updatedAt;
  
  duplicateData.status = 'draft';
  duplicateData.issueDate = new Date();
  duplicateData.convertedToInvoice = false;
  duplicateData.invoiceId = undefined;
  duplicateData.convertedToProject = false;
  duplicateData.projectId = undefined;
  
  // Set new validity date
  const newValidDate = new Date();
  newValidDate.setDate(newValidDate.getDate() + 30);
  duplicateData.validUntil = newValidDate;

  return new this.constructor(duplicateData);
};

// Static Methods
quoteSchema.statics.findByUser = function(userId, options = {}) {
  const query = { createdBy: userId, isActive: true };

  if (options.status) query.status = options.status;
  if (options.clientId) query.clientId = options.clientId;
  
  if (options.dateFrom || options.dateTo) {
    query.issueDate = {};
    if (options.dateFrom) query.issueDate.$gte = new Date(options.dateFrom);
    if (options.dateTo) query.issueDate.$lte = new Date(options.dateTo);
  }

  return this.find(query)
    .populate('clientId', 'firstName lastName company email address')
    .populate('createdBy', 'firstName lastName email')
    .sort(options.sort || { issueDate: -1 });
};

quoteSchema.statics.getExpiringQuotes = function(userId, days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    createdBy: userId,
    isActive: true,
    status: { $in: ['sent', 'viewed'] },
    validUntil: { 
      $gte: new Date(),
      $lte: futureDate 
    }
  })
  .populate('clientId', 'firstName lastName company email')
  .sort({ validUntil: 1 });
};

quoteSchema.statics.getQuoteStatistics = function(userId, dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);

  return this.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(userId),
        issueDate: { $gte: startDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        avgAmount: { $avg: '$total' }
      }
    }
  ]);
};

const Quote = mongoose.model('Quote', quoteSchema);

export default Quote;