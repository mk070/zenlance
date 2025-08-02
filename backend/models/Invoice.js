import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  // Basic Information
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Invoice number cannot exceed 50 characters']
  },
  title: {
    type: String,
    required: [true, 'Invoice title is required'],
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

  // Invoice Details
  issueDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft'
  },
  template: {
    type: String,
    enum: ['modern', 'classic', 'minimal', 'corporate', 'creative'],
    default: 'modern'
  },

  // Financial Information
  items: [{
    description: {
      type: String,
      required: [true, 'Item description is required'],
      trim: true,
      maxlength: [200, 'Item description cannot exceed 200 characters']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative']
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

  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'credit_card', 'paypal', 'stripe', 'cash', 'check', 'other']
  },
  paymentDate: Date,
  paymentReference: String,
  
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
  },

  // Recurring Invoice Information
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringFrequency: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly']
  },
  nextInvoiceDate: Date,
  parentInvoiceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ clientId: 1, status: 1 });
invoiceSchema.index({ createdBy: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });
invoiceSchema.index({ issueDate: -1 });
invoiceSchema.index({ total: -1 });

// Compound indexes
invoiceSchema.index({
  createdBy: 1,
  status: 1,
  issueDate: -1
});

invoiceSchema.index({
  clientId: 1,
  issueDate: -1
});

// Virtual for days until due
invoiceSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
invoiceSchema.virtual('isOverdue').get(function() {
  if (this.status === 'paid' || this.status === 'cancelled') return false;
  return this.daysUntilDue < 0;
});

// Virtual for formatted total
invoiceSchema.virtual('formattedTotal').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  }).format(this.total);
});

// Pre-save middleware
invoiceSchema.pre('save', async function(next) {
  // Generate invoice number if not provided
  if (!this.invoiceNumber) {
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
    this.invoiceNumber = `INV-${year}${month}-${sequential}`;
  }

  // Calculate amounts
  this.calculateAmounts();

  // Update status based on due date
  if (this.status === 'sent' && this.dueDate && new Date() > this.dueDate) {
    this.status = 'overdue';
  }

  // Set due date if not provided (30 days from issue date)
  if (!this.dueDate) {
    this.dueDate = new Date(this.issueDate);
    this.dueDate.setDate(this.dueDate.getDate() + 30);
  }

  next();
});

// Instance Methods
invoiceSchema.methods.calculateAmounts = function() {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => {
    item.amount = item.quantity * item.rate;
    return sum + item.amount;
  }, 0);

  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.tax) / 100;

  // Calculate discount amount
  this.discountAmount = (this.subtotal * this.discount) / 100;

  // Calculate total
  this.total = this.subtotal + this.taxAmount - this.discountAmount;
};

invoiceSchema.methods.markAsSent = function(recipients = []) {
  this.status = 'sent';
  this.sentDate = new Date();
  if (recipients.length > 0) {
    this.sentTo = recipients;
  }
  return this.save();
};

invoiceSchema.methods.markAsPaid = function(paymentMethod, paymentReference) {
  this.status = 'paid';
  this.paymentDate = new Date();
  if (paymentMethod) this.paymentMethod = paymentMethod;
  if (paymentReference) this.paymentReference = paymentReference;
  return this.save();
};

invoiceSchema.methods.markAsViewed = function() {
  this.viewedDate = new Date();
  this.viewCount += 1;
  return this.save();
};

invoiceSchema.methods.incrementDownloadCount = function() {
  this.downloadCount += 1;
  return this.save();
};

invoiceSchema.methods.duplicate = function() {
  const duplicateData = this.toObject();
  delete duplicateData._id;
  delete duplicateData.invoiceNumber;
  delete duplicateData.sentDate;
  delete duplicateData.sentTo;
  delete duplicateData.viewedDate;
  delete duplicateData.viewCount;
  delete duplicateData.downloadCount;
  delete duplicateData.paymentDate;
  delete duplicateData.paymentReference;
  delete duplicateData.createdAt;
  delete duplicateData.updatedAt;
  
  duplicateData.status = 'draft';
  duplicateData.issueDate = new Date();
  
  // Set new due date
  const newDueDate = new Date();
  newDueDate.setDate(newDueDate.getDate() + 30);
  duplicateData.dueDate = newDueDate;

  return new this.constructor(duplicateData);
};

// Static Methods
invoiceSchema.statics.findByUser = function(userId, options = {}) {
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

invoiceSchema.statics.getOverdueInvoices = function(userId) {
  return this.find({
    createdBy: userId,
    isActive: true,
    status: { $in: ['sent', 'overdue'] },
    dueDate: { $lt: new Date() }
  })
  .populate('clientId', 'firstName lastName company email')
  .sort({ dueDate: 1 });
};

invoiceSchema.statics.getInvoiceStatistics = function(userId, dateRange = 30) {
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

invoiceSchema.statics.getRevenueByMonth = function(userId, months = 12) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return this.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(userId),
        status: 'paid',
        paymentDate: { $gte: startDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' }
        },
        revenue: { $sum: '$total' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

invoiceSchema.statics.getTopClients = function(userId, limit = 10) {
  return this.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(userId),
        status: 'paid',
        isActive: true
      }
    },
    {
      $group: {
        _id: '$clientId',
        totalRevenue: { $sum: '$total' },
        invoiceCount: { $sum: 1 },
        lastInvoiceDate: { $max: '$issueDate' }
      }
    },
    {
      $lookup: {
        from: 'clients',
        localField: '_id',
        foreignField: '_id',
        as: 'client'
      }
    },
    {
      $unwind: '$client'
    },
    {
      $sort: { totalRevenue: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice; 