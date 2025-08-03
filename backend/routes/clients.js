import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import Client from '../models/Client.js';
import { catchAsync, AppError, handleValidationError } from '../middleware/errorMiddleware.js';
import { authenticate, requireEmailVerification } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);
// Note: Email verification temporarily disabled for development
// router.use(requireEmailVerification);

// Validation middleware
const createClientValidation = [
  body('firstName').notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional().matches(/^[\+]?[0-9\s\-\(\)]{10,}$/).withMessage('Invalid phone number'),
  body('company').notEmpty().withMessage('Company name is required').isLength({ max: 100 }),
  body('jobTitle').optional().isLength({ max: 80 }),
  body('industry').optional().isIn([
    'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
    'Manufacturing', 'Real Estate', 'Legal', 'Marketing', 'Consulting',
    'Non-Profit', 'Government', 'Entertainment', 'Food & Beverage',
    'Travel & Tourism', 'Automotive', 'Construction', 'Energy',
    'Telecommunications', 'Other'
  ]),
  body('companySize').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'Unknown']),
  body('status').optional().isIn(['Active', 'Inactive', 'Potential', 'Former', 'Blacklisted']),
  body('type').optional().isIn(['Individual', 'Small Business', 'Enterprise', 'Agency', 'Non-Profit']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'VIP']),
  body('acquisitionSource').optional().isIn([
    'Referral', 'Website', 'Social Media', 'Cold Outreach',
    'Networking', 'Previous Client', 'Marketing Campaign',
    'Trade Show', 'Converted Lead', 'Other'
  ]),
  body('address.street').optional().isString(),
  body('address.city').optional().isString(),
  body('address.state').optional().isString(),
  body('address.country').optional().isString(),
  body('address.zipCode').optional().isString(),
  body('website').optional().matches(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/),
  body('billingDetails.currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'Other']),
  body('billingDetails.paymentTerms').optional().isIn(['Net 15', 'Net 30', 'Net 60', 'Net 90', 'Due on Receipt', 'Custom']),
  body('billingDetails.creditLimit').optional().isNumeric().isFloat({ min: 0 }),
  body('billingDetails.invoiceDeliveryMethod').optional().isIn(['Email', 'Mail', 'Portal', 'Both']),
  body('tags').optional().isArray(),
  body('tags.*').optional().isLength({ max: 30 })
];

const updateClientValidation = [
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
  body('companySize').optional().isIn(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'Unknown']),
  body('status').optional().isIn(['Active', 'Inactive', 'Potential', 'Former', 'Blacklisted']),
  body('type').optional().isIn(['Individual', 'Small Business', 'Enterprise', 'Agency', 'Non-Profit']),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'VIP']),
  body('acquisitionSource').optional().isIn([
    'Referral', 'Website', 'Social Media', 'Cold Outreach',
    'Networking', 'Previous Client', 'Marketing Campaign',
    'Trade Show', 'Converted Lead', 'Other'
  ]),
  body('website').optional().matches(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/),
  body('billingDetails.currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY', 'Other']),
  body('billingDetails.paymentTerms').optional().isIn(['Net 15', 'Net 30', 'Net 60', 'Net 90', 'Due on Receipt', 'Custom']),
  body('billingDetails.creditLimit').optional().isNumeric().isFloat({ min: 0 }),
  body('billingDetails.invoiceDeliveryMethod').optional().isIn(['Email', 'Mail', 'Portal', 'Both']),
  body('tags').optional().isArray(),
  body('tags.*').optional().isLength({ max: 30 })
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['Active', 'Inactive', 'Potential', 'Former', 'Blacklisted']),
  query('priority').optional().isIn(['Low', 'Medium', 'High', 'VIP']),
  query('type').optional().isIn(['Individual', 'Small Business', 'Enterprise', 'Agency', 'Non-Profit']),
  query('sortBy').optional().isIn(['createdAt', 'acquisitionDate', 'financialMetrics.totalRevenue', 'lastInteractionDate']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('search').optional().isLength({ max: 100 }),
  query('minRevenue').optional().isNumeric().isFloat({ min: 0 }),
  query('maxRevenue').optional().isNumeric().isFloat({ min: 0 })
];

// GET /api/clients - Get all clients for current user
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
    type,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    minRevenue,
    maxRevenue
  } = req.query;

  // Build query
  const query = { relationshipManager: req.user._id, isActive: true };
  
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (type) query.type = type;
  
  // Revenue filtering
  if (minRevenue || maxRevenue) {
    query['financialMetrics.totalRevenue'] = {};
    if (minRevenue) query['financialMetrics.totalRevenue'].$gte = parseFloat(minRevenue);
    if (maxRevenue) query['financialMetrics.totalRevenue'].$lte = parseFloat(maxRevenue);
  }
  
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
  
  const [clients, total] = await Promise.all([
    Client.find(query)
      .populate('relationshipManager', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit)),
    Client.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      clients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: skip + clients.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
}));

// GET /api/clients/statistics - Get client statistics for current user
router.get('/statistics', catchAsync(async (req, res) => {
  const { days = 30 } = req.query;
  
  const stats = await Client.getClientStatistics(req.user._id, parseInt(days));
  
  // Get additional metrics
  const totalClients = await Client.countDocuments({ 
    relationshipManager: req.user._id, 
    isActive: true 
  });
  
  const highValueClients = await Client.countDocuments({ 
    relationshipManager: req.user._id, 
    isActive: true,
    'financialMetrics.totalRevenue': { $gte: 10000 }
  });
  
  const vipClients = await Client.countDocuments({
    relationshipManager: req.user._id,
    isActive: true,
    priority: 'VIP'
  });

  const clientsForReview = await Client.countDocuments({
    relationshipManager: req.user._id,
    isActive: true,
    nextReviewDate: { $lte: new Date() }
  });

  // Calculate total revenue
  const revenueResult = await Client.aggregate([
    {
      $match: {
        relationshipManager: req.user._id,
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$financialMetrics.totalRevenue' },
        avgRevenue: { $avg: '$financialMetrics.totalRevenue' }
      }
    }
  ]);

  const totalRevenue = revenueResult[0]?.totalRevenue || 0;
  const avgRevenue = revenueResult[0]?.avgRevenue || 0;

  res.json({
    success: true,
    data: {
      statistics: stats,
      summary: {
        totalClients,
        highValueClients,
        vipClients,
        clientsForReview,
        totalRevenue,
        avgRevenue
      }
    }
  });
}));

// GET /api/clients/high-value - Get high-value clients
router.get('/high-value', [
  query('minValue').optional().isNumeric().isFloat({ min: 0 })
], catchAsync(async (req, res) => {
  const minValue = parseFloat(req.query.minValue) || 10000;
  const clients = await Client.getHighValueClients(req.user._id, minValue);
  
  res.json({
    success: true,
    data: {
      clients
    }
  });
}));

// GET /api/clients/revenue-by-month - Get revenue by month
router.get('/revenue-by-month', [
  query('months').optional().isInt({ min: 1, max: 24 })
], catchAsync(async (req, res) => {
  const months = parseInt(req.query.months) || 12;
  const revenueData = await Client.getRevenueByMonth(req.user._id, months);
  
  res.json({
    success: true,
    data: {
      revenueByMonth: revenueData
    }
  });
}));

// GET /api/clients/for-review - Get clients requiring review
router.get('/for-review', catchAsync(async (req, res) => {
  const clients = await Client.getClientsForReview(req.user._id);
  
  res.json({
    success: true,
    data: {
      clients
    }
  });
}));

// GET /api/clients/:id - Get specific client
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid client ID')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const client = await Client.findOne({ 
    _id: req.params.id, 
    relationshipManager: req.user._id,
    isActive: true 
  })
    .populate('relationshipManager', 'firstName lastName email')
    .populate('createdBy', 'firstName lastName email')
    .populate('notes.createdBy', 'firstName lastName email')
    .populate('projects.projectManager', 'firstName lastName email')
    .populate('convertedFromLead.leadId', 'firstName lastName email leadScore');

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  res.json({
    success: true,
    data: {
      client
    }
  });
}));

// POST /api/clients - Create new client
router.post('/', createClientValidation, catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  // Check if client with same email already exists
  const existingClient = await Client.findOne({ 
    email: req.body.email,
    relationshipManager: req.user._id,
    isActive: true
  });

  if (existingClient) {
    throw new AppError('A client with this email already exists', 409);
  }

  const clientData = {
    ...req.body,
    relationshipManager: req.user._id,
    createdBy: req.user._id
  };

  const client = new Client(clientData);
  await client.save();

  // Populate the saved client
  await client.populate('relationshipManager', 'firstName lastName email');
  await client.populate('createdBy', 'firstName lastName email');

  res.status(201).json({
    success: true,
    message: 'Client created successfully',
    data: {
      client
    }
  });
}));

// PUT /api/clients/:id - Update client
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid client ID'),
  ...updateClientValidation
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const client = await Client.findOne({ 
    _id: req.params.id, 
    relationshipManager: req.user._id,
    isActive: true 
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  // If email is being updated, check for duplicates
  if (req.body.email && req.body.email !== client.email) {
    const existingClient = await Client.findOne({ 
      email: req.body.email,
      relationshipManager: req.user._id,
      isActive: true,
      _id: { $ne: req.params.id }
    });

    if (existingClient) {
      throw new AppError('A client with this email already exists', 409);
    }
  }

  // Track status changes
  const oldStatus = client.status;
  
  // Update client
  Object.assign(client, req.body);
  
  // Add automatic note for status changes
  if (req.body.status && req.body.status !== oldStatus) {
    client.notes.push({
      content: `Status changed from ${oldStatus} to ${req.body.status}`,
      type: 'Important',
      createdBy: req.user._id,
      createdAt: new Date()
    });
  }

  await client.save();

  // Populate the updated client
  await client.populate('relationshipManager', 'firstName lastName email');
  await client.populate('createdBy', 'firstName lastName email');

  res.json({
    success: true,
    message: 'Client updated successfully',
    data: {
      client
    }
  });
}));

// POST /api/clients/:id/notes - Add note to client
router.post('/:id/notes', [
  param('id').isMongoId().withMessage('Invalid client ID'),
  body('content').notEmpty().withMessage('Note content is required').isLength({ max: 1000 }),
  body('type').optional().isIn(['General', 'Meeting', 'Phone Call', 'Email', 'Important', 'Warning']),
  body('isPrivate').optional().isBoolean()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const client = await Client.findOne({ 
    _id: req.params.id, 
    relationshipManager: req.user._id,
    isActive: true 
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  await client.addNote(
    req.body.content, 
    req.user._id, 
    req.body.type || 'General',
    req.body.isPrivate || false
  );

  res.json({
    success: true,
    message: 'Note added successfully',
    data: {
      note: client.notes[client.notes.length - 1]
    }
  });
}));

// POST /api/clients/:id/projects - Add project to client
router.post('/:id/projects', [
  param('id').isMongoId().withMessage('Invalid client ID'),
  body('name').notEmpty().withMessage('Project name is required').isLength({ max: 100 }),
  body('description').optional().isString(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('value').optional().isNumeric().isFloat({ min: 0 }),
  body('status').optional().isIn(['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled']),
  body('tags').optional().isArray()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const client = await Client.findOne({ 
    _id: req.params.id, 
    relationshipManager: req.user._id,
    isActive: true 
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  await client.addProject(req.body, req.user._id);

  res.json({
    success: true,
    message: 'Project added successfully',
    data: {
      project: client.projects[client.projects.length - 1]
    }
  });
}));

// PUT /api/clients/:id/projects/:projectId - Update project
router.put('/:id/projects/:projectId', [
  param('id').isMongoId().withMessage('Invalid client ID'),
  param('projectId').isMongoId().withMessage('Invalid project ID'),
  body('name').optional().isLength({ max: 100 }),
  body('description').optional().isString(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('value').optional().isNumeric().isFloat({ min: 0 }),
  body('status').optional().isIn(['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled']),
  body('tags').optional().isArray()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const client = await Client.findOne({ 
    _id: req.params.id, 
    relationshipManager: req.user._id,
    isActive: true 
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  try {
    await client.updateProject(req.params.projectId, req.body);
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        project: client.projects.id(req.params.projectId)
      }
    });
  } catch (error) {
    if (error.message === 'Project not found') {
      throw new AppError('Project not found', 404);
    }
    throw error;
  }
}));

// POST /api/clients/:id/contracts - Add contract to client
router.post('/:id/contracts', [
  param('id').isMongoId().withMessage('Invalid client ID'),
  body('name').notEmpty().withMessage('Contract name is required'),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('value').optional().isNumeric().isFloat({ min: 0 }),
  body('status').optional().isIn(['Draft', 'Sent', 'Signed', 'Active', 'Expired', 'Terminated']),
  body('renewalDate').optional().isISO8601(),
  body('autoRenewal').optional().isBoolean(),
  body('terms').optional().isString()
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const client = await Client.findOne({ 
    _id: req.params.id, 
    relationshipManager: req.user._id,
    isActive: true 
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  await client.addContract(req.body);

  res.json({
    success: true,
    message: 'Contract added successfully',
    data: {
      contract: client.contracts[client.contracts.length - 1]
    }
  });
}));

// PUT /api/clients/:id/status - Update client status
router.put('/:id/status', [
  param('id').isMongoId().withMessage('Invalid client ID'),
  body('status').notEmpty().isIn(['Active', 'Inactive', 'Potential', 'Former', 'Blacklisted'])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const client = await Client.findOne({ 
    _id: req.params.id, 
    relationshipManager: req.user._id,
    isActive: true 
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  await client.updateStatus(req.body.status, req.user._id);

  res.json({
    success: true,
    message: 'Client status updated successfully',
    data: {
      client: {
        _id: client._id,
        status: client.status
      }
    }
  });
}));

// PUT /api/clients/:id/priority - Update client priority
router.put('/:id/priority', [
  param('id').isMongoId().withMessage('Invalid client ID'),
  body('priority').notEmpty().isIn(['Low', 'Medium', 'High', 'VIP'])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const client = await Client.findOne({ 
    _id: req.params.id, 
    relationshipManager: req.user._id,
    isActive: true 
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  const oldPriority = client.priority;
  client.priority = req.body.priority;

  // Add automatic note for priority changes
  client.notes.push({
    content: `Priority changed from ${oldPriority} to ${req.body.priority}`,
    type: 'Important',
    createdBy: req.user._id,
    createdAt: new Date()
  });

  await client.save();

  res.json({
    success: true,
    message: 'Client priority updated successfully',
    data: {
      client: {
        _id: client._id,
        priority: client.priority
      }
    }
  });
}));

// DELETE /api/clients/:id - Soft delete client
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid client ID')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const client = await Client.findOne({ 
    _id: req.params.id, 
    relationshipManager: req.user._id,
    isActive: true 
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  // Soft delete
  client.isActive = false;
  client.status = 'Former';
  
  // Add deletion note
  client.notes.push({
    content: 'Client record deleted',
    type: 'Important',
    createdBy: req.user._id,
    createdAt: new Date()
  });

  await client.save();

  res.json({
    success: true,
    message: 'Client deleted successfully'
  });
}));

// DELETE /api/clients/:id/permanent - Permanent delete client (admin only or after 30 days)
router.delete('/:id/permanent', [
  param('id').isMongoId().withMessage('Invalid client ID')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const client = await Client.findOne({ 
    _id: req.params.id, 
    relationshipManager: req.user._id
  });

  if (!client) {
    throw new AppError('Client not found', 404);
  }

  // Check if client was soft deleted more than 30 days ago
  if (client.isActive) {
    throw new AppError('Client must be deleted first before permanent deletion', 400);
  }

  const daysSinceDeleted = Math.floor((Date.now() - client.updatedAt) / (1000 * 60 * 60 * 24));
  if (daysSinceDeleted < 30) {
    throw new AppError('Client can only be permanently deleted 30 days after soft deletion', 400);
  }

  await Client.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Client permanently deleted'
  });
}));

export default router; 