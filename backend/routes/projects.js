import express from 'express';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import Quote from '../models/Quote.js';
import authMiddleware from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all projects for the authenticated user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, clientId, priority, dateFrom, dateTo, search, page = 1, limit = 20 } = req.query;

    const options = {
      status,
      clientId,
      priority,
      dateFrom,
      dateTo
    };

    let projects = await Project.findByUser(req.user.id, options);

    // Apply search filter if provided
    if (search) {
      projects = projects.filter(project => 
        project.projectNumber.toLowerCase().includes(search.toLowerCase()) ||
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.clientName.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = projects.length;
    const paginatedProjects = projects.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedProjects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error.message
    });
  }
});

// Get project statistics
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const statistics = await Project.getProjectStatistics(req.user.id);
    
    const formattedStats = {
      byStatus: {},
      totalCount: 0,
      totalBudget: 0,
      avgProgress: 0
    };

    statistics.forEach(stat => {
      formattedStats.byStatus[stat._id] = {
        count: stat.count,
        totalBudget: stat.totalBudget,
        avgProgress: stat.avgProgress
      };
      formattedStats.totalCount += stat.count;
      formattedStats.totalBudget += stat.totalBudget;
    });

    if (formattedStats.totalCount > 0) {
      formattedStats.avgProgress = statistics.reduce((sum, stat) => 
        sum + (stat.avgProgress * stat.count), 0
      ) / formattedStats.totalCount;
    }

    res.json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    logger.error('Error fetching project statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Get active projects
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const activeProjects = await Project.getActiveProjects(req.user.id);

    res.json({
      success: true,
      data: activeProjects
    });
  } catch (error) {
    logger.error('Error fetching active projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active projects',
      error: error.message
    });
  }
});

// Get overdue projects
router.get('/overdue', authMiddleware, async (req, res) => {
  try {
    const overdueProjects = await Project.getOverdueProjects(req.user.id);

    res.json({
      success: true,
      data: overdueProjects
    });
  } catch (error) {
    logger.error('Error fetching overdue projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue projects',
      error: error.message
    });
  }
});

// Get upcoming milestones
router.get('/milestones/upcoming', authMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const upcomingMilestones = await Project.getUpcomingMilestones(req.user.id, parseInt(days));

    res.json({
      success: true,
      data: upcomingMilestones
    });
  } catch (error) {
    logger.error('Error fetching upcoming milestones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming milestones',
      error: error.message
    });
  }
});

// Get a single project
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true 
    })
    .populate('clientId', 'firstName lastName company email phone address')
    .populate('quoteId', 'quoteNumber status total')
    .populate('invoiceIds', 'invoiceNumber status total')
    .populate('team.userId', 'firstName lastName email')
    .populate('notes.createdBy', 'firstName lastName')
    .populate('files.uploadedBy', 'firstName lastName');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    logger.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project',
      error: error.message
    });
  }
});

// Create a new project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { clientId, quoteId, ...projectData } = req.body;

    // Validate client exists and belongs to user
    const client = await Client.findOne({
      _id: clientId,
      createdBy: req.user.id,
      isActive: true
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // If quote is provided, validate it exists and update it
    if (quoteId) {
      const quote = await Quote.findOne({
        _id: quoteId,
        createdBy: req.user.id,
        isActive: true
      });

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Quote not found'
        });
      }

      // Update quote to indicate it's converted to a project
      quote.convertedToProject = true;
      await quote.save();
    }

    // Create project with client information
    const project = new Project({
      ...projectData,
      clientId: client._id,
      clientName: `${client.firstName} ${client.lastName}`,
      clientEmail: client.email,
      quoteId,
      createdBy: req.user.id
    });

    await project.save();

    // Populate the project before sending response
    await project.populate('clientId', 'firstName lastName company email phone address');
    if (quoteId) {
      await project.populate('quoteId', 'quoteNumber status total');
    }

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
      error: error.message
    });
  }
});

// Update a project
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Update project fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdBy' && key !== 'milestones' && key !== 'contract') {
        project[key] = req.body[key];
      }
    });

    await project.save();
    await project.populate('clientId', 'firstName lastName company email phone address');

    res.json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
      error: error.message
    });
  }
});

// Delete a project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Soft delete
    project.isActive = false;
    await project.save();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: error.message
    });
  }
});

// Contract Management Routes

// Get project contract
router.get('/:id/contract', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.contract) {
      return res.status(404).json({
        success: false,
        message: 'No contract associated with this project'
      });
    }

    res.json({
      success: true,
      data: project.contract
    });
  } catch (error) {
    logger.error('Error fetching contract:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contract',
      error: error.message
    });
  }
});

// Create or update project contract
router.put('/:id/contract', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Update or create contract
    project.contract = {
      ...project.contract,
      ...req.body,
      signatures: project.contract?.signatures || []
    };

    await project.save();

    res.json({
      success: true,
      data: project.contract,
      message: 'Contract updated successfully'
    });
  } catch (error) {
    logger.error('Error updating contract:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contract',
      error: error.message
    });
  }
});

// Sign project contract
router.post('/:id/contract/sign', authMiddleware, async (req, res) => {
  try {
    const { party, name, email, signatureData, ipAddress, userAgent } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (!project.contract) {
      return res.status(400).json({
        success: false,
        message: 'No contract to sign'
      });
    }

    const signatureInfo = {
      party,
      name,
      email,
      signedAt: new Date(),
      signatureData,
      ipAddress,
      userAgent
    };

    await project.signContract(signatureInfo);

    res.json({
      success: true,
      data: project.contract,
      message: 'Contract signed successfully'
    });
  } catch (error) {
    logger.error('Error signing contract:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sign contract',
      error: error.message
    });
  }
});

// Milestone Management Routes

// Add milestone to project
router.post('/:id/milestones', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.addMilestone(req.body);

    res.json({
      success: true,
      data: project.milestones,
      message: 'Milestone added successfully'
    });
  } catch (error) {
    logger.error('Error adding milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add milestone',
      error: error.message
    });
  }
});

// Update milestone
router.put('/:id/milestones/:milestoneId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    Object.assign(milestone, req.body);
    await project.save();

    res.json({
      success: true,
      data: milestone,
      message: 'Milestone updated successfully'
    });
  } catch (error) {
    logger.error('Error updating milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update milestone',
      error: error.message
    });
  }
});

// Update milestone status
router.patch('/:id/milestones/:milestoneId/status', authMiddleware, async (req, res) => {
  try {
    const { status, approvedBy } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.updateMilestoneStatus(req.params.milestoneId, status, { approvedBy });

    res.json({
      success: true,
      data: project.milestones.id(req.params.milestoneId),
      message: 'Milestone status updated successfully'
    });
  } catch (error) {
    logger.error('Error updating milestone status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update milestone status',
      error: error.message
    });
  }
});

// Delete milestone
router.delete('/:id/milestones/:milestoneId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.milestones.pull(req.params.milestoneId);
    await project.save();

    res.json({
      success: true,
      message: 'Milestone deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting milestone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete milestone',
      error: error.message
    });
  }
});

// Add note to project
router.post('/:id/notes', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;

    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.addNote(content, req.user.id);

    res.json({
      success: true,
      data: project.notes[project.notes.length - 1],
      message: 'Note added successfully'
    });
  } catch (error) {
    logger.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
});

// Add file to project
router.post('/:id/files', authMiddleware, async (req, res) => {
  try {
    const fileData = {
      ...req.body,
      uploadedBy: req.user.id
    };

    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.addFile(fileData);

    res.json({
      success: true,
      data: project.files[project.files.length - 1],
      message: 'File added successfully'
    });
  } catch (error) {
    logger.error('Error adding file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add file',
      error: error.message
    });
  }
});

export default router;