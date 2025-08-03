import express from 'express';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import Quote from '../models/Quote.js';
import { authenticate } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all projects for the authenticated user
router.get('/', authenticate, async (req, res) => {
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
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase()) ||
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
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const { dateRange = 30 } = req.query;
    const statistics = await Project.getProjectStatistics(req.user.id, parseInt(dateRange));
    
    const formattedStats = {
      byStatus: {},
      byPriority: {},
      totalCount: 0,
      totalValue: 0,
      completionRate: 0
    };

    statistics.forEach(stat => {
      if (stat._id.status) {
        formattedStats.byStatus[stat._id.status] = {
          count: stat.count,
          totalBudget: stat.totalBudget,
          avgBudget: stat.avgBudget
        };
      }
      if (stat._id.priority) {
        formattedStats.byPriority[stat._id.priority] = {
          count: stat.count,
          totalBudget: stat.totalBudget
        };
      }
      formattedStats.totalCount += stat.count;
      formattedStats.totalValue += stat.totalBudget;
    });

    // Calculate completion rate
    const completedProjects = formattedStats.byStatus['completed']?.count || 0;
    formattedStats.completionRate = formattedStats.totalCount > 0 
      ? Math.round((completedProjects / formattedStats.totalCount) * 100) 
      : 0;

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

// Get projects due soon
router.get('/due-soon', authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const dueSoonProjects = await Project.getDueSoon(req.user.id, parseInt(days));

    res.json({
      success: true,
      data: dueSoonProjects
    });
  } catch (error) {
    logger.error('Error fetching due soon projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch due soon projects',
      error: error.message
    });
  }
});

// Get overdue projects
router.get('/overdue', authenticate, async (req, res) => {
  try {
    const overdueProjects = await Project.getOverdue(req.user.id);

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

// Get project milestones
router.get('/:id/milestones', authenticate, async (req, res) => {
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

    res.json({
      success: true,
      data: project.milestones
    });
  } catch (error) {
    logger.error('Error fetching project milestones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project milestones',
      error: error.message
    });
  }
});

// Get a single project
router.get('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({ 
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true 
    })
    .populate('clientId', 'firstName lastName company email phone address')
    .populate('quoteId', 'quoteNumber total status')
    .populate('invoiceIds', 'invoiceNumber total status dueDate');

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
router.post('/', authenticate, async (req, res) => {
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

    // Validate quote if provided
    if (quoteId) {
      const quote = await Quote.findOne({
        _id: quoteId,
        createdBy: req.user.id,
        isActive: true,
        status: 'accepted'
      });

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Quote not found or not accepted'
        });
      }
    }

    // Create project with client information
    const project = new Project({
      ...projectData,
      clientId: client._id,
      clientName: `${client.firstName} ${client.lastName}`,
      clientEmail: client.email,
      quoteId: quoteId || undefined,
      createdBy: req.user.id
    });

    await project.save();

    // Populate the project before sending response
    await project.populate('clientId', 'firstName lastName company email phone address');
    if (quoteId) {
      await project.populate('quoteId', 'quoteNumber total status');
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
router.put('/:id', authenticate, async (req, res) => {
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

    // Don't allow editing if project is completed or cancelled
    if (['completed', 'cancelled'].includes(project.status) && req.body.status !== project.status) {
      return res.status(400).json({
        success: false,
        message: `Cannot modify ${project.status} projects`
      });
    }

    // Update project fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'createdBy') {
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
router.delete('/:id', authenticate, async (req, res) => {
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

// Add milestone to project
router.post('/:id/milestones', authenticate, async (req, res) => {
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

    const milestone = await project.addMilestone(req.body);

    res.status(201).json({
      success: true,
      data: milestone,
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
router.put('/:id/milestones/:milestoneId', authenticate, async (req, res) => {
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

    const milestone = await project.updateMilestone(req.params.milestoneId, req.body);

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

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

// Delete milestone
router.delete('/:id/milestones/:milestoneId', authenticate, async (req, res) => {
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

    await project.removeMilestone(req.params.milestoneId);

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

// Add task to project
router.post('/:id/tasks', authenticate, async (req, res) => {
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

    const task = await project.addTask(req.body);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task added successfully'
    });
  } catch (error) {
    logger.error('Error adding task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add task',
      error: error.message
    });
  }
});

// Update task
router.put('/:id/tasks/:taskId', authenticate, async (req, res) => {
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

    const task = await project.updateTask(req.params.taskId, req.body);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    logger.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

// Delete task
router.delete('/:id/tasks/:taskId', authenticate, async (req, res) => {
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

    await project.removeTask(req.params.taskId);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
});

// Add comment to project
router.post('/:id/comments', authenticate, async (req, res) => {
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

    const comment = await project.addComment({
      ...req.body,
      author: req.user.id,
      authorName: `${req.user.firstName} ${req.user.lastName}`
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: 'Comment added successfully'
    });
  } catch (error) {
    logger.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
});

// Update project status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, reason } = req.body;
    
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

    await project.updateStatus(status, reason);

    res.json({
      success: true,
      data: project,
      message: 'Project status updated successfully'
    });
  } catch (error) {
    logger.error('Error updating project status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project status',
      error: error.message
    });
  }
});

// Generate project report
router.get('/:id/report', authenticate, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    })
    .populate('clientId', 'firstName lastName company email phone')
    .populate('quoteId', 'quoteNumber total')
    .populate('invoiceIds', 'invoiceNumber total status');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const report = await project.generateReport();

    res.json({
      success: true,
      data: report,
      message: 'Project report generated successfully'
    });
  } catch (error) {
    logger.error('Error generating project report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate project report',
      error: error.message
    });
  }
});

// Archive project
router.patch('/:id/archive', authenticate, async (req, res) => {
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

    await project.archive();

    res.json({
      success: true,
      data: project,
      message: 'Project archived successfully'
    });
  } catch (error) {
    logger.error('Error archiving project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive project',
      error: error.message
    });
  }
});

// Duplicate project
router.post('/:id/duplicate', authenticate, async (req, res) => {
  try {
    const originalProject = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isActive: true
    });

    if (!originalProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const duplicatedProject = originalProject.duplicate();
    await duplicatedProject.save();
    await duplicatedProject.populate('clientId', 'firstName lastName company email phone address');

    res.json({
      success: true,
      data: duplicatedProject,
      message: 'Project duplicated successfully'
    });
  } catch (error) {
    logger.error('Error duplicating project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate project',
      error: error.message
    });
  }
});

export default router;