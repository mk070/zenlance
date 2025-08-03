import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { catchAsync, AppError, handleValidationError } from '../middleware/errorMiddleware.js';
import { authenticate, requireEmailVerification } from '../middleware/authMiddleware.js';
import aiService from '../services/aiService.js';
import Lead from '../models/Lead.js';
import Client from '../models/Client.js';
import Quote from '../models/Quote.js';
import Project from '../models/Project.js';
import SocialPost from '../models/SocialPost.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// AI service health check (public endpoint)
router.get('/health', catchAsync(async (req, res) => {
  const healthStatus = await aiService.healthCheck();
  
  res.json({
    success: true,
    data: healthStatus
  });
}));

// Apply authentication to all other routes
router.use(authenticate);

// Generate AI proposal for a lead
router.post('/generate-proposal/:leadId', [
  param('leadId').isMongoId().withMessage('Invalid lead ID'),
  body('projectRequirements').optional().isObject(),
  body('customInstructions').optional().isString().isLength({ max: 1000 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  // Get lead data
  const lead = await Lead.findOne({
    _id: req.params.leadId,
    assignedTo: req.user._id,
    isActive: true
  }).populate('assignedTo', 'firstName lastName email company');

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  // Get client data if lead is converted
  let clientData = null;
  if (lead.convertedToClient && lead.clientId) {
    clientData = await Client.findById(lead.clientId);
  }

  try {
    const result = await aiService.generateProposal(
      lead.toObject(),
      clientData?.toObject(),
      req.body.projectRequirements || {}
    );

    if (!result.success) {
      throw new AppError(result.error, 500);
    }

    // Log AI usage for analytics
    logger.info('AI proposal generated', {
      userId: req.user._id,
      leadId: req.params.leadId,
      usage: result.usage
    });

    res.json({
      success: true,
      data: {
        proposal: result.proposal,
        usage: result.usage
      }
    });
  } catch (error) {
    logger.error('AI proposal generation error:', error);
    throw new AppError(error.message || 'Failed to generate proposal', 500);
  }
}));

// Generate follow-up email for a lead
router.post('/generate-followup/:leadId', [
  param('leadId').isMongoId().withMessage('Invalid lead ID'),
  body('context').optional().isObject(),
  body('emailType').optional().isIn(['follow_up', 'proposal_sent', 'check_in', 'closing', 'nurture'])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const lead = await Lead.findOne({
    _id: req.params.leadId,
    assignedTo: req.user._id,
    isActive: true
  });

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  // Calculate context
  const context = {
    ...req.body.context,
    lastContactDate: lead.lastContactDate,
    daysSinceContact: lead.daysSinceLastContact,
    emailType: req.body.emailType || 'follow_up'
  };

  try {
    const result = await aiService.generateFollowUpEmail(lead.toObject(), context);

    if (!result.success) {
      throw new AppError(result.error, 500);
    }

    logger.info('AI follow-up email generated', {
      userId: req.user._id,
      leadId: req.params.leadId,
      usage: result.usage
    });

    res.json({
      success: true,
      data: {
        subject: result.subject,
        email: result.email,
        usage: result.usage
      }
    });
  } catch (error) {
    logger.error('AI follow-up generation error:', error);
    throw new AppError(error.message || 'Failed to generate follow-up email', 500);
  }
}));

// Enrich lead data with AI
router.post('/enrich-lead/:leadId', [
  param('leadId').isMongoId().withMessage('Invalid lead ID')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const lead = await Lead.findOne({
    _id: req.params.leadId,
    assignedTo: req.user._id,
    isActive: true
  });

  if (!lead) {
    throw new AppError('Lead not found', 404);
  }

  try {
    const result = await aiService.enrichLeadData(lead.toObject());

    if (!result.success) {
      throw new AppError(result.error, 500);
    }

    // Optionally update the lead with enriched data
    if (req.body.autoApply && result.enrichedData) {
      const updates = {};
      
      // Only update fields that are currently empty or enhance existing ones
      if (!lead.industry && result.enrichedData.industry) {
        updates.industry = result.enrichedData.industry;
      }
      
      if (!lead.budget?.min && result.enrichedData.budgetRange?.min) {
        updates['budget.min'] = result.enrichedData.budgetRange.min;
        updates['budget.max'] = result.enrichedData.budgetRange.max;
      }

      if (Object.keys(updates).length > 0) {
        await Lead.findByIdAndUpdate(req.params.leadId, updates);
      }
    }

    logger.info('AI lead enrichment completed', {
      userId: req.user._id,
      leadId: req.params.leadId,
      usage: result.usage
    });

    res.json({
      success: true,
      data: {
        enrichedData: result.enrichedData,
        usage: result.usage
      }
    });
  } catch (error) {
    logger.error('AI lead enrichment error:', error);
    throw new AppError(error.message || 'Failed to enrich lead data', 500);
  }
}));

// Get AI action suggestions for any entity
router.post('/suggest-actions/:entityType/:entityId', [
  param('entityType').isIn(['lead', 'client', 'project', 'quote']),
  param('entityId').isMongoId().withMessage('Invalid entity ID')
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const { entityType, entityId } = req.params;
  let entity;

  // Get entity based on type
  switch (entityType) {
    case 'lead':
      entity = await Lead.findOne({
        _id: entityId,
        assignedTo: req.user._id,
        isActive: true
      });
      break;
    case 'client':
      entity = await Client.findOne({
        _id: entityId,
        relationshipManager: req.user._id,
        isActive: true
      });
      break;
    case 'project':
      entity = await Project.findOne({
        _id: entityId,
        projectManager: req.user._id,
        isActive: true
      });
      break;
    case 'quote':
      entity = await Quote.findOne({
        _id: entityId,
        createdBy: req.user._id,
        isActive: true
      });
      break;
    default:
      throw new AppError('Invalid entity type', 400);
  }

  if (!entity) {
    throw new AppError(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} not found`, 404);
  }

  try {
    const result = await aiService.suggestNextActions(entity.toObject(), entityType);

    if (!result.success) {
      throw new AppError(result.error, 500);
    }

    logger.info('AI action suggestions generated', {
      userId: req.user._id,
      entityType,
      entityId,
      usage: result.usage
    });

    res.json({
      success: true,
      data: {
        suggestions: result.suggestions,
        usage: result.usage
      }
    });
  } catch (error) {
    logger.error('AI action suggestions error:', error);
    throw new AppError(error.message || 'Failed to generate action suggestions', 500);
  }
}));

// Summarize document content
router.post('/summarize', [
  body('content').notEmpty().withMessage('Content is required'),
  body('documentType').optional().isIn(['proposal', 'contract', 'email', 'notes', 'general'])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  try {
    const result = await aiService.summarizeDocument(
      req.body.content,
      req.body.documentType || 'general'
    );

    if (!result.success) {
      throw new AppError(result.error, 500);
    }

    logger.info('AI document summary generated', {
      userId: req.user._id,
      documentType: req.body.documentType,
      contentLength: req.body.content.length,
      usage: result.usage
    });

    res.json({
      success: true,
      data: {
        summary: result.summary,
        usage: result.usage
      }
    });
  } catch (error) {
    logger.error('AI document summary error:', error);
    throw new AppError(error.message || 'Failed to summarize document', 500);
  }
}));

// Generate social media content
router.post('/generate-social-content', [
  body('context').optional().isObject(),
  body('platform').optional().isIn(['linkedin', 'twitter', 'facebook', 'instagram']),
  body('contentType').optional().isIn(['achievement', 'tip', 'case_study', 'thought_leadership', 'promotion'])
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  const context = {
    platform: req.body.platform || 'linkedin',
    contentType: req.body.contentType || 'general',
    ...req.body.context
  };

  try {
    const result = await aiService.generateSocialContent(context);

    if (!result.success) {
      throw new AppError(result.error, 500);
    }

    logger.info('AI social content generated', {
      userId: req.user._id,
      platform: context.platform,
      contentType: context.contentType,
      usage: result.usage
    });

    res.json({
      success: true,
      data: {
        content: result.content,
        usage: result.usage
      }
    });
  } catch (error) {
    logger.error('AI social content generation error:', error);
    throw new AppError(error.message || 'Failed to generate social content', 500);
  }
}));

// Generate business analytics and insights
router.post('/analyze-business-metrics', [
  body('timeRange').optional().isIn(['week', 'month', 'quarter', 'year']),
  body('includeForecasting').optional().isBoolean()
], catchAsync(async (req, res) => {
  try {
    // Gather user's business metrics
    const timeRange = req.body.timeRange || 'month';
    const userId = req.user._id;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Gather metrics from different entities
    const [leads, clients, quotes, projects] = await Promise.all([
      Lead.find({ assignedTo: userId, createdAt: { $gte: startDate } }),
      Client.find({ relationshipManager: userId, createdAt: { $gte: startDate } }),
      Quote.find({ createdBy: userId, createdAt: { $gte: startDate } }),
      Project.find({ projectManager: userId, createdAt: { $gte: startDate } })
    ]);

    // Compile metrics data
    const metricsData = {
      timeRange,
      leads: {
        total: leads.length,
        byStatus: leads.reduce((acc, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {}),
        avgLeadScore: leads.reduce((sum, lead) => sum + (lead.leadScore || 0), 0) / leads.length || 0,
        converted: leads.filter(lead => lead.convertedToClient).length
      },
      clients: {
        total: clients.length,
        byStatus: clients.reduce((acc, client) => {
          acc[client.status] = (acc[client.status] || 0) + 1;
          return acc;
        }, {}),
        totalValue: clients.reduce((sum, client) => sum + (client.lifetime_value || 0), 0)
      },
      quotes: {
        total: quotes.length,
        byStatus: quotes.reduce((acc, quote) => {
          acc[quote.status] = (acc[quote.status] || 0) + 1;
          return acc;
        }, {}),
        totalValue: quotes.reduce((sum, quote) => sum + (quote.total || 0), 0),
        avgValue: quotes.reduce((sum, quote) => sum + (quote.total || 0), 0) / quotes.length || 0,
        acceptanceRate: (quotes.filter(q => q.status === 'accepted').length / quotes.length * 100) || 0
      },
      projects: {
        total: projects.length,
        byStatus: projects.reduce((acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        }, {}),
        totalValue: projects.reduce((sum, project) => sum + (project.total || 0), 0),
        avgDuration: projects.reduce((sum, project) => {
          if (project.startDate && project.endDate) {
            return sum + (new Date(project.endDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24);
          }
          return sum;
        }, 0) / projects.length || 0
      }
    };

    const result = await aiService.analyzeBusinessMetrics(metricsData);

    if (!result.success) {
      throw new AppError(result.error, 500);
    }

    logger.info('AI business analysis generated', {
      userId: req.user._id,
      timeRange,
      usage: result.usage
    });

    res.json({
      success: true,
      data: {
        analysis: result.analysis,
        rawMetrics: metricsData,
        usage: result.usage
      }
    });
  } catch (error) {
    logger.error('AI business analysis error:', error);
    throw new AppError(error.message || 'Failed to analyze business metrics', 500);
  }
}));

// AI-powered payment reminder generation
router.post('/generate-payment-reminder/:invoiceId', [
  param('invoiceId').isMongoId().withMessage('Invalid invoice ID'),
  body('reminderType').optional().isIn(['gentle', 'firm', 'final']),
  body('daysOverdue').optional().isInt({ min: 0 })
], catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(handleValidationError(errors));
  }

  // For now, we'll create a simple reminder generator
  // In a full implementation, you'd have an Invoice model
  const invoiceId = req.params.invoiceId;
  const reminderType = req.body.reminderType || 'gentle';
  const daysOverdue = req.body.daysOverdue || 0;

  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a professional accounts receivable specialist. Create polite but effective payment reminder emails that maintain client relationships while encouraging prompt payment.'
      },
      {
        role: 'user',
        content: `Create a ${reminderType} payment reminder email for:
        - Invoice ID: ${invoiceId}
        - Days overdue: ${daysOverdue}
        - Reminder type: ${reminderType}
        
        Include subject line and email body. Be professional and diplomatic.`
      }
    ];

    const result = await aiService.makeRequest(messages, { maxTokens: 800 });

    logger.info('AI payment reminder generated', {
      userId: req.user._id,
      invoiceId,
      reminderType,
      usage: result.usage
    });

    res.json({
      success: true,
      data: {
        reminder: result.content,
        usage: result.usage
      }
    });
  } catch (error) {
    logger.error('AI payment reminder error:', error);
    throw new AppError(error.message || 'Failed to generate payment reminder', 500);
  }
}));

export default router; 