import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import { catchAsync, AppError, handleValidationError } from '../middleware/errorMiddleware.js';
import { authenticate, requireEmailVerification } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);
// Note: Email verification temporarily disabled for development
// router.use(requireEmailVerification);

// Validation middleware
const createLeadValidation = [
  body('firstName').notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().matches(/^[\+]?[0-9\s\-\(\)]{10,}$/).withMessage('Invalid phone number'),
  body('company').optional().isLength({ max: 100 }),
  body('jobTitle').optional().isLength({ max: 80 }),
  body('industry').optional().isIn([
    'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
    'Manufacturing', 'Real Estate', 'Legal', 'Marketing', 'Consulting',
    'Non-Profit', 'Government', 'Entertainment', 'Food & Beverage',
    'Travel & Tourism', 'Automotive', 'Construction', 'Energy',
    'Telecommunications', 'Other'
  ]),
  body('source').notEmpty().withMessage('Lead source is required').isIn([
    'Website', 'Social Media', 'Email Campaign', 'Referral',
    'Cold Call', 'LinkedIn', 'Google Ads', 'Facebook Ads',
    'Trade Show', 'Webinar', 'Content Marketing', 'SEO',
    'Word of Mouth', 'Direct Mail', 'Other'
  ]),
  body('status').optional().isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
  body('projectType').optional().isLength({ max: 100 }),
  body('budget.min').optional().isNumeric().isFloat({ min: 0 }),
  body('budget.max').optional().isNumeric().isFloat({ min: 0 }),
  body('budget.currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'Other']),
  body('timeline.startDate').optional().isISO8601(),
  body('timeline.endDate').optional().isISO8601(),
  body('timeline.urgency').optional().isIn(['Flexible', 'Soon', 'ASAP', 'Specific Date']),
  body('description').optional().isLength({ max: 2000 }),
  body('tags').optional().isArray(),
  body('tags.*').optional().isLength({ max: 30 })
];

const updateLeadValidation = [
  body('firstName').optional().isLength({ max: 50 }),
  body('lastName').optional().isLength({ max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^[\+]?[0-9\s\-\(\)]{10,}$/),
  body('company').optional().isLength({ max: 100 }),
  body('jobTitle').optional().isLength({ max: 80 }),
  body('industry').optional().isIn([
    'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
    'Manufacturing', 'Real Estate', 'Legal', 'Marketing', 'Consulting',
    'Non-Profit', 'Government', 'Entertainment', 'Food & Beverage',
    'Travel & Tourism', 'Automotive', 'Construction', 'Energy',
    'Telecommunications', 'Other'
  ]),
  body('source').optional().isIn([
    'Website', 'Social Media', 'Email Campaign', 'Referral',
    'Cold Call', 'LinkedIn', 'Google Ads', 'Facebook Ads',
    'Trade Show', 'Webinar', 'Content Marketing', 'SEO',
    'Word of Mouth', 'Direct Mail', 'Other'
  ]),
  body('status').optional().isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
  body('projectType').optional().isLength({ max: 100 }),
  body('budget.min').optional().isNumeric().isFloat({ min: 0 }),
  body('budget.max').optional().isNumeric().isFloat({ min: 0 }),
  body('budget.currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'Other']),
  body('timeline.startDate').optional().isISO8601(),
  body('timeline.endDate').optional().isISO8601(),
  body('timeline.urgency').optional().isIn(['Flexible', 'Soon', 'ASAP', 'Specific Date']),
  body('description').optional().isLength({ max: 2000 }),
  body('tags').optional().isArray(),
  body('tags.*').optional().isLength({ max: 30 })
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']),
  query('priority').optional().isIn(['Low', 'Medium', 'High', 'Urgent']),
  query('source').optional().isIn([
    'Website', 'Social Media', 'Email Campaign', 'Referral',
    'Cold Call', 'LinkedIn', 'Google Ads', 'Facebook Ads',
    'Trade Show', 'Webinar', 'Content Marketing', 'SEO',
    'Word of Mouth', 'Direct Mail', 'Other'
  ]),
  query('sortBy').optional().isIn(['createdAt', 'leadScore', 'lastContactDate', 'nextFollowUpDate']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().isLength({ max: 100 })
];

// GET /api/leads - Get all leads for current user
router.get('/', queryValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const {
    page = 1,
    limit = 20,
    status,
    priority,
    source,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search
  } = req.query;

  // Build query
  const query = { assignedTo: req.user._id, isActive: true };
  
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (source) query.source = source;
  
  // Search functionality
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } }
    ];
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query with pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [leads, total] = await Promise.all([
    Lead.find(query)
      .populate('assignedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Lead.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      leads,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: skip + leads.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
}));

// GET /api/leads/statistics - Get lead statistics for current user
router.get('/statistics', catchAsync(async (req, res) => {
  const { days = 30 } = req.query;
  
  const stats = await Lead.getLeadStatistics(req.user._id, parseInt(days));
  
  // Get additional metrics
  const totalLeads = await Lead.countDocuments({ 
    assignedTo: req.user._id, 
    isActive: true 
  });
  
  const highPriorityLeads = await Lead.countDocuments({ 
    assignedTo: req.user._id, 
    isActive: true,
    priority: { $in: ['High', 'Urgent'] }
  });
  
  const leadsRequiringFollowUp = await Lead.countDocuments({
    assignedTo: req.user._id,
    isActive: true,
    nextFollowUpDate: { $lte: new Date() },
    status: { $nin: ['Won', 'Lost'] }
  });

  res.json({
    success: true,
    data: {
      statistics: stats,
      summary: {
        totalLeads,
        highPriorityLeads,
        leadsRequiringFollowUp
      }
    }
  });
}));

// GET /api/leads/follow-up - Get leads requiring follow-up
router.get('/follow-up', catchAsync(async (req, res) => {
  const leads = await Lead.getLeadsRequiringFollowUp(req.user._id);
  
  res.json({
    success: true,
    data: {
      leads
    }
  });
}));

// GET /api/leads/:id - Get specific lead
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid lead ID')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const lead = await Lead.findOne({ 
    _id: req.params.id, 
    assignedTo: req.user._id,
    isActive: true 
  })
    .populate('assignedTo', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .populate('notes.createdBy', 'firstName lastName email')
    .populate('communications.createdBy', 'firstName lastName email');

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  res.json({
    success: true,
    data: {
      lead
    }
  });
}));

// POST /api/leads - Create new lead
router.post('/', createLeadValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  // Check if lead with same email already exists
  const existingLead = await Lead.findOne({ 
    email: req.body.email,
    assignedTo: req.user._id,
    isActive: true
  });

  if (existingLead) {
    throw new AppError('A lead with this email already exists', 409);
  }

  const leadData = {
    ...req.body,
    assignedTo: req.user._id,
    createdBy: req.user._id
  };

  const lead = new Lead(leadData);
  await lead.save();

  // Populate the saved lead
  await lead.populate('assignedTo', 'firstName lastName email');
  await lead.populate('createdBy', 'firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Lead created successfully',
    data: {
      lead
    }
  });
}));

// PUT /api/leads/:id - Update lead
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  ...updateLeadValidation
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const lead = await Lead.findOne({ 
    _id: req.params.id, 
    assignedTo: req.user._id,
    isActive: true 
  });

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  // If email is being updated, check for duplicates
  if (req.body.email && req.body.email !== lead.email) {
    const existingLead = await Lead.findOne({ 
      email: req.body.email,
      assignedTo: req.user._id,
      isActive: true,
      _id: { $ne: req.params.id }
    });

    if (existingLead) {
      throw new AppError('A lead with this email already exists', 409);
    }
  }

  // Track status changes
  const oldStatus = lead.status;
  
  // Update lead
  Object.assign(lead, req.body);
  
  // Add automatic note for status changes
  if (req.body.status && req.body.status !== oldStatus) {
    lead.notes.push({
      content: `Status changed from ${oldStatus} to ${req.body.status}`,
      createdBy: req.user._id,
      createdAt: new Date()
    });
  }

  await lead.save();

  // Populate the updated lead
  await lead.populate('assignedTo', 'firstName lastName email');
  await lead.populate('createdBy', 'firstName lastName email');

  res.json({
    success: true,
    message: 'Lead updated successfully',
    data: {
      lead
    }
  });
}));

// POST /api/leads/:id/notes - Add note to lead
router.post('/:id/notes', [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('content').notEmpty().withMessage('Note content is required').isLength({ max: 1000 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const lead = await Lead.findOne({ 
    _id: req.params.id, 
    assignedTo: req.user._id,
    isActive: true 
  });

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  await lead.addNote(req.body.content, req.user._id);

  res.json({
    success: true,
    message: 'Note added successfully',
    data: {
      note: lead.notes[lead.notes.length - 1]
    }
  });
}));

// POST /api/leads/:id/communications - Add communication to lead
router.post('/:id/communications', [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('type').notEmpty().isIn(['Email', 'Phone', 'Meeting', 'LinkedIn', 'Other']),
  body('subject').optional().isLength({ max: 200 }),
  body('content').optional().isLength({ max: 1000 }),
  body('outcome').optional().isIn(['Positive', 'Neutral', 'Negative', 'No Response']),
  body('nextFollowUp').optional().isISO8601()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const lead = await Lead.findOne({ 
    _id: req.params.id, 
    assignedTo: req.user._id,
    isActive: true 
  });

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  await lead.addCommunication(req.body, req.user._id);

  res.json({
    success: true,
    message: 'Communication added successfully',
    data: {
      communication: lead.communications[lead.communications.length - 1]
    }
  });
}));

// PUT /api/leads/:id/status - Update lead status
router.put('/:id/status', [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('status').notEmpty().isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const lead = await Lead.findOne({ 
    _id: req.params.id, 
    assignedTo: req.user._id,
    isActive: true 
  });

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  await lead.updateStatus(req.body.status, req.user._id);

  res.json({
    success: true,
    message: 'Lead status updated successfully',
    data: {
      lead: {
        _id: lead._id,
        status: lead.status,
        leadScore: lead.leadScore
      }
    }
  });
}));

// POST /api/leads/:id/convert - Convert lead to client
router.post('/:id/convert', [
  param('id').isMongoId().withMessage('Invalid lead ID'),
  body('clientData').optional().isObject(),
  body('clientData.acquisitionSource').optional().isString(),
  body('clientData.priority').optional().isIn(['Low', 'Medium', 'High', 'VIP']),
  body('clientData.type').optional().isIn(['Individual', 'Small Business', 'Enterprise', 'Agency', 'Non-Profit'])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const lead = await Lead.findOne({ 
    _id: req.params.id, 
    assignedTo: req.user._id,
    isActive: true 
  });

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  if (lead.convertedToClient) {
    throw new AppError('Lead has already been converted to client', 400);
  }

  // Check if client with same email already exists
  const existingClient = await Client.findOne({ 
    email: lead.email,
    relationshipManager: req.user._id,
    isActive: true
  });

  if (existingClient) {
    throw new AppError('A client with this email already exists', 409);
  }

  // Create client from lead data
  const clientData = {
    firstName: lead.firstName,
    lastName: lead.lastName,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    jobTitle: lead.jobTitle,
    industry: lead.industry,
    relationshipManager: req.user._id,
    createdBy: req.user._id,
    acquisitionSource: req.body.clientData?.acquisitionSource || 'Converted Lead',
    priority: req.body.clientData?.priority || 'Medium',
    type: req.body.clientData?.type || 'Small Business',
    convertedFromLead: {
      leadId: lead._id,
      conversionDate: new Date(),
      conversionValue: lead.budget?.min || 0
    },
    // Copy tags from lead
    tags: lead.tags || [],
    // Create initial note about conversion
    notes: [{
      content: `Client converted from lead. Original lead score: ${lead.leadScore}`,
      type: 'Important',
      createdBy: req.user._id,
      createdAt: new Date()
    }]
  };

  // If lead has project information, create initial project
  if (lead.projectType || lead.description) {
    clientData.projects = [{
      name: lead.projectType || 'Initial Project',
      description: lead.description,
      startDate: lead.timeline?.startDate || new Date(),
      endDate: lead.timeline?.endDate,
      value: lead.budget?.min || 0,
      projectManager: req.user._id,
      status: 'Planning',
      tags: lead.tags || []
    }];
  }

  const client = new Client(clientData);
  await client.save();

  // Update lead to mark as converted
  lead.convertedToClient = true;
  lead.convertedAt = new Date();
  lead.clientId = client._id;
  lead.status = 'Won';
  
  // Add conversion note to lead
  lead.notes.push({
    content: `Lead successfully converted to client: ${client.fullName}`,
    createdBy: req.user._id,
    createdAt: new Date()
  });

  await lead.save();

  // Populate the new client
  await client.populate('relationshipManager', 'firstName lastName email');
  await client.populate('createdBy', 'firstName lastName email');

  res.json({
    success: true,
    message: 'Lead converted to client successfully',
    data: {
      client,
      lead: {
        _id: lead._id,
        status: lead.status,
        convertedToClient: lead.convertedToClient,
        clientId: lead.clientId
      }
    }
  });
}));

// DELETE /api/leads/:id - Soft delete lead
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid lead ID')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const lead = await Lead.findOne({ 
    _id: req.params.id, 
    assignedTo: req.user._id,
    isActive: true 
  });

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  // Soft delete
  lead.isActive = false;
  await lead.save();

  res.json({
    success: true,
    message: 'Lead deleted successfully'
  });
}));

// DELETE /api/leads/:id/permanent - Permanent delete lead (admin only or after 30 days)
router.delete('/:id/permanent', [
  param('id').isMongoId().withMessage('Invalid lead ID')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const lead = await Lead.findOne({ 
    _id: req.params.id, 
    assignedTo: req.user._id
  });

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  // Check if lead was soft deleted more than 30 days ago
  if (lead.isActive) {
    throw new AppError('Lead must be deleted first before permanent deletion', 400);
  }

  const daysSinceDeleted = Math.floor((Date.now() - lead.updatedAt) / (1000 * 60 * 60 * 24));
  if (daysSinceDeleted < 30) {
    throw new AppError('Lead can only be permanently deleted 30 days after soft deletion', 400);
  }

  await Lead.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Lead permanently deleted'
  });
}));

export default router; 