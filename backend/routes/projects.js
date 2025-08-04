import express from 'express'
import Project from '../models/Project.js'
import Client from '../models/Client.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { AppError } from '../middleware/errorMiddleware.js'
import mongoose from 'mongoose'

const router = express.Router()

// Apply authentication middleware to all routes
router.use(authenticate)

// Helper function to find or create client by email
const findOrCreateClient = async (emailOrClientId, leadData = null, userId) => {
  let client = null
  
  // If it's already a valid ObjectId, try to find the client
  if (mongoose.Types.ObjectId.isValid(emailOrClientId)) {
    client = await Client.findOne({ _id: emailOrClientId, createdBy: userId })
    if (client) return client
  }
  
  // Treat as email and search for existing client
  const email = emailOrClientId
  client = await Client.findOne({ 
    email: email.toLowerCase(), 
    createdBy: userId 
  })
  
  if (client) {
    return client
  }
  
  // Create new client if leadData is provided
  if (leadData) {
    const newClientData = {
      firstName: leadData.firstName || leadData.name?.split(' ')[0] || 'Unknown',
      lastName: leadData.lastName || leadData.name?.split(' ').slice(1).join(' ') || '',
      email: email.toLowerCase(),
      phone: leadData.phone || '',
      company: leadData.company || '',
      source: leadData.source || 'Lead Conversion',
      createdBy: userId
    }
    
    client = new Client(newClientData)
    await client.save()
    return client
  }
  
  return null
}

// GET /api/projects - Get all projects for the user
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 12, search, status, priority, client } = req.query
    const userId = req.user._id

    let query = {
      $or: [
        { createdBy: userId },
        { 'teamMembers.userId': userId }
      ],
      archived: { $ne: true }
    }

    // Apply filters
    if (status) query.status = status
    if (priority) query.priority = priority
    if (client) query.clientId = client

    // Apply search
    if (search) {
      const searchRegex = new RegExp(search, 'i')
      const searchCondition = {
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { clientName: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      }
      
      if (query.$and) {
        query.$and.push(searchCondition)
      } else {
        query.$and = [searchCondition]
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    
    const [projects, totalCount] = await Promise.all([
      Project.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('teamMembers.userId', 'firstName lastName email')
        .populate('clientId', 'firstName lastName email company')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Project.countDocuments(query)
    ])

    const totalPages = Math.ceil(totalCount / parseInt(limit))

    res.json({
      success: true,
      data: projects,
      pagination: {
        current: parseInt(page),
        pages: totalPages,
        total: totalCount,
        limit: parseInt(limit)
      }
    })
  } catch (error) {
    console.error('Error fetching projects:', error)
    next(new AppError('Failed to fetch projects', 500))
  }
})

// GET /api/projects/:id - Get a specific project
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user._id
    const projectId = req.params.id

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { 'teamMembers.userId': userId }
      ],
      archived: { $ne: true }
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('teamMembers.userId', 'firstName lastName email')
      .populate('clientId', 'firstName lastName email company')
      .populate('tasks.assignedTo', 'firstName lastName email')
      .populate('notes.createdBy', 'firstName lastName email')

    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    res.json({
      success: true,
      data: project
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    next(new AppError('Failed to fetch project', 500))
  }
})

// POST /api/projects - Create a new project
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user._id
    const {
      name,
      description,
      clientId,
      clientEmail,
      clientName,
      leadData, // For lead conversion
      status = 'draft',
      priority = 'medium',
      startDate,
      endDate,
      budget,
      currency = 'USD',
      tags = [],
      teamMembers = [],
      notes = '',
      estimatedHours,
      hourlyRate
    } = req.body

    // Validate required fields
    if (!name?.trim()) {
      return next(new AppError('Project name is required', 400))
    }

    // Client is now mandatory - either clientId, clientEmail, or leadData must be provided
    if (!clientId && !clientEmail && !leadData?.email) {
      return next(new AppError('Client information is required. Please provide client ID, email, or lead data.', 400))
    }

    // Find or create client
    let client = null
    
    if (clientId) {
      // Use existing client ID
      client = await findOrCreateClient(clientId, null, userId)
      if (!client) {
        return next(new AppError('Client not found', 404))
      }
    } else if (clientEmail) {
      // Find existing client by email or require manual client creation
      client = await findOrCreateClient(clientEmail, null, userId)
      if (!client) {
        return next(new AppError('Client with this email not found. Please create the client first.', 404))
      }
    } else if (leadData?.email) {
      // Create client from lead data
      client = await findOrCreateClient(leadData.email, leadData, userId)
      if (!client) {
        return next(new AppError('Failed to create client from lead data', 500))
      }
    }

    const resolvedClientName = client.name || `${client.firstName} ${client.lastName}`.trim()

    const projectData = {
      name: name.trim(),
      description: description?.trim(),
      status,
      priority,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      budget: budget ? parseFloat(budget) : undefined,
      currency,
      clientId: client._id, // Always use the found/created client ID
      clientName: resolvedClientName,
      tags: Array.isArray(tags) ? tags.filter(tag => tag?.trim()) : [],
      createdBy: userId,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined
    }

    // Add team members if provided
    if (Array.isArray(teamMembers) && teamMembers.length > 0) {
      projectData.teamMembers = teamMembers.map(member => ({
        userId: member.userId,
        role: member.role || 'developer',
        permissions: member.permissions || ['read']
      }))
    }

    const project = new Project(projectData)
    await project.save()

    // Add initial note if provided
    if (notes?.trim()) {
      await project.addNote({ content: notes.trim(), type: 'general' }, userId)
    }

    // Populate the response
    await project.populate('createdBy', 'firstName lastName email')
    await project.populate('teamMembers.userId', 'firstName lastName email')
    await project.populate('clientId', 'firstName lastName email company')

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully'
    })
  } catch (error) {
    console.error('Error creating project:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return next(new AppError(`Validation error: ${errors.join(', ')}`, 400))
    }
    
    if (error.code === 11000) {
      return next(new AppError('Project with this name already exists', 400))
    }
    
    next(new AppError('Failed to create project', 500))
  }
})

// PUT /api/projects/:id - Update a project
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.user._id
    const projectId = req.params.id
    const updates = req.body

    // Find project and ensure user has access
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { 'teamMembers.userId': userId }
      ],
      archived: { $ne: true }
    })

    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    // If clientId is being updated, verify it exists
    if (updates.clientId) {
      // Handle empty string clientId
      if (updates.clientId === '' || updates.clientId === null) {
        delete updates.clientId
        delete updates.clientName
      } else {
        const client = await Client.findOne({ _id: updates.clientId, createdBy: userId })
        if (!client) {
          return next(new AppError('Client not found', 404))
        }
        updates.clientName = client.name || `${client.firstName} ${client.lastName}`.trim()
      }
    }

    // Update project fields
    Object.assign(project, updates)
    project.lastModifiedBy = userId
    
    await project.save()

    // Populate the response
    await project.populate('createdBy', 'firstName lastName email')
    await project.populate('teamMembers.userId', 'firstName lastName email')
    await project.populate('clientId', 'firstName lastName email company')

    res.json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    })
  } catch (error) {
    console.error('Error updating project:', error)
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return next(new AppError(`Validation error: ${errors.join(', ')}`, 400))
    }
    
    if (error.code === 11000) {
      return next(new AppError('Project with this name already exists', 400))
    }
    
    next(new AppError('Failed to update project', 500))
  }
})

// PATCH /api/projects/:id/status - Update project status
router.patch('/:id/status', async (req, res, next) => {
  try {
    const userId = req.user._id
    const projectId = req.params.id
    const { status } = req.body

    if (!status) {
      return next(new AppError('Status is required', 400))
    }

    const validStatuses = ['draft', 'proposal', 'contracted', 'in_progress', 'on_hold', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return next(new AppError('Invalid status', 400))
    }

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { 'teamMembers.userId': userId }
      ],
      archived: { $ne: true }
    })

    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    project.status = status
    project.lastModifiedBy = userId

    // Set completion date if status is completed
    if (status === 'completed' && project.status !== 'completed') {
      project.actualEndDate = new Date()
    }

    await project.save()

    res.json({
      success: true,
      data: { status: project.status },
      message: 'Project status updated successfully'
    })
  } catch (error) {
    console.error('Error updating project status:', error)
    next(new AppError('Failed to update project status', 500))
  }
})

// DELETE /api/projects/:id - Archive a project
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user._id
    const projectId = req.params.id

    const project = await Project.findOne({
      _id: projectId,
      createdBy: userId,
      archived: { $ne: true }
    })

    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    // Archive instead of delete
    project.archived = true
    project.archivedAt = new Date()
    project.lastModifiedBy = userId
    await project.save()

    res.json({
      success: true,
      message: 'Project archived successfully'
    })
  } catch (error) {
    console.error('Error archiving project:', error)
    next(new AppError('Failed to delete project', 500))
  }
})

// POST /api/projects/:id/tasks - Add a task to a project
router.post('/:id/tasks', async (req, res, next) => {
  try {
    const userId = req.user._id
    const projectId = req.params.id
    const { title, description, status = 'pending', priority = 'medium', assignedTo, dueDate, estimatedHours } = req.body

    if (!title?.trim()) {
      return next(new AppError('Task title is required', 400))
    }

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { 'teamMembers.userId': userId }
      ],
      archived: { $ne: true }
    })

    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    const taskData = {
      title: title.trim(),
      description: description?.trim(),
      status,
      priority,
      assignedTo: assignedTo || undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined
    }

    project.tasks.push(taskData)
    project.updateProgress()
    project.lastModifiedBy = userId
    await project.save()

    const newTask = project.tasks[project.tasks.length - 1]

    res.status(201).json({
      success: true,
      data: newTask,
      message: 'Task added successfully'
    })
  } catch (error) {
    console.error('Error adding task:', error)
    next(new AppError('Failed to add task', 500))
  }
})

// PUT /api/projects/:id/tasks/:taskId - Update a task
router.put('/:id/tasks/:taskId', async (req, res, next) => {
  try {
    const userId = req.user._id
    const { id: projectId, taskId } = req.params
    const { title, description, status, priority, assignedTo, dueDate, estimatedHours, actualHours } = req.body

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { 'teamMembers.userId': userId }
      ],
      archived: { $ne: true }
    })

    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    const task = project.tasks.id(taskId)
    if (!task) {
      return next(new AppError('Task not found', 404))
    }

    // Update task fields
    if (title !== undefined) {
      if (!title?.trim()) {
        return next(new AppError('Task title cannot be empty', 400))
      }
      task.title = title.trim()
    }
    if (description !== undefined) task.description = description?.trim()
    if (status !== undefined) task.status = status
    if (priority !== undefined) task.priority = priority
    if (assignedTo !== undefined) task.assignedTo = assignedTo || undefined
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours ? parseFloat(estimatedHours) : undefined
    if (actualHours !== undefined) task.actualHours = actualHours ? parseFloat(actualHours) : undefined

    // Set completion date if status changed to completed
    if (status === 'completed' && task.status !== 'completed') {
      task.completedAt = new Date()
    } else if (status && status !== 'completed') {
      task.completedAt = undefined
    }

    project.updateProgress()
    project.lastModifiedBy = userId
    await project.save()

    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    })
  } catch (error) {
    console.error('Error updating task:', error)
    next(new AppError('Failed to update task', 500))
  }
})

// DELETE /api/projects/:id/tasks/:taskId - Delete a task
router.delete('/:id/tasks/:taskId', async (req, res, next) => {
  try {
    const userId = req.user._id
    const { id: projectId, taskId } = req.params

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { 'teamMembers.userId': userId }
      ],
      archived: { $ne: true }
    })

    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    const task = project.tasks.id(taskId)
    if (!task) {
      return next(new AppError('Task not found', 404))
    }

    task.remove()
    project.updateProgress()
    project.lastModifiedBy = userId
    await project.save()

    res.json({
      success: true,
      message: 'Task deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting task:', error)
    next(new AppError('Failed to delete task', 500))
  }
})

// POST /api/projects/:id/notes - Add a note to a project
router.post('/:id/notes', async (req, res, next) => {
  try {
    const userId = req.user._id
    const projectId = req.params.id
    const { content, type = 'general' } = req.body

    if (!content?.trim()) {
      return next(new AppError('Note content is required', 400))
    }

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { createdBy: userId },
        { 'teamMembers.userId': userId }
      ],
      archived: { $ne: true }
    })

    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    const noteData = {
      content: content.trim(),
      type,
      createdBy: userId
    }

    project.notes.push(noteData)
    project.lastModifiedBy = userId
    await project.save()

    const newNote = project.notes[project.notes.length - 1]
    await project.populate('notes.createdBy', 'firstName lastName email')

    res.status(201).json({
      success: true,
      data: newNote,
      message: 'Note added successfully'
    })
  } catch (error) {
    console.error('Error adding note:', error)
    next(new AppError('Failed to add note', 500))
  }
})

// GET /api/projects/statistics - Get project statistics for the user
router.get('/statistics', async (req, res, next) => {
  try {
    const userId = req.user._id

    const stats = await Project.getProjectStatistics(userId)
    
    res.json({
      success: true,
      data: stats[0] || {
        total: 0,
        active: 0,
        completed: 0,
        totalBudget: 0,
        averageProgress: 0
      }
    })
  } catch (error) {
    console.error('Error fetching project statistics:', error)
    next(new AppError('Failed to fetch project statistics', 500))
  }
})

// PATCH /api/projects/:id/progress - Update project progress
router.patch('/:id/progress', async (req, res, next) => {
  try {
    const userId = req.user._id
    const { progress } = req.body

    if (progress < 0 || progress > 100) {
      return next(new AppError('Progress must be between 0 and 100', 400))
    }

    const project = await Project.findOne({ _id: req.params.id, createdBy: userId })
    
    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    project.progress = progress
    await project.save()

    res.json({
      success: true,
      data: project,
      message: 'Progress updated successfully'
    })
  } catch (error) {
    console.error('Error updating progress:', error)
    next(new AppError('Failed to update progress', 500))
  }
})

// POST /api/projects/:id/milestones - Add milestone
router.post('/:id/milestones', async (req, res, next) => {
  try {
    const userId = req.user._id
    const { title, description, dueDate, status = 'pending' } = req.body

    if (!title?.trim()) {
      return next(new AppError('Milestone title is required', 400))
    }

    const project = await Project.findOne({ _id: req.params.id, createdBy: userId })
    
    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    const milestone = {
      title: title.trim(),
      description: description?.trim(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status
    }

    project.milestones.push(milestone)
    await project.save()

    const newMilestone = project.milestones[project.milestones.length - 1]

    res.status(201).json({
      success: true,
      data: newMilestone,
      message: 'Milestone added successfully'
    })
  } catch (error) {
    console.error('Error adding milestone:', error)
    next(new AppError('Failed to add milestone', 500))
  }
})

// PUT /api/projects/:id/milestones/:milestoneId - Update milestone
router.put('/:id/milestones/:milestoneId', async (req, res, next) => {
  try {
    const userId = req.user._id
    const { title, description, dueDate, status } = req.body

    const project = await Project.findOne({ _id: req.params.id, createdBy: userId })
    
    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    const milestone = project.milestones.id(req.params.milestoneId)
    if (!milestone) {
      return next(new AppError('Milestone not found', 404))
    }

    if (title) milestone.title = title.trim()
    if (description !== undefined) milestone.description = description?.trim()
    if (dueDate) milestone.dueDate = new Date(dueDate)
    if (status) milestone.status = status

    await project.save()

    res.json({
      success: true,
      data: milestone,
      message: 'Milestone updated successfully'
    })
  } catch (error) {
    console.error('Error updating milestone:', error)
    next(new AppError('Failed to update milestone', 500))
  }
})

// DELETE /api/projects/:id/milestones/:milestoneId - Delete milestone
router.delete('/:id/milestones/:milestoneId', async (req, res, next) => {
  try {
    const userId = req.user._id

    const project = await Project.findOne({ _id: req.params.id, createdBy: userId })
    
    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    project.milestones.pull(req.params.milestoneId)
    await project.save()

    res.json({
      success: true,
      message: 'Milestone deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting milestone:', error)
    next(new AppError('Failed to delete milestone', 500))
  }
})

// POST /api/projects/:id/notify-client - Send client notification
router.post('/:id/notify-client', async (req, res, next) => {
  try {
    const userId = req.user._id
    const { message, includeProgress = true, includeMilestones = true, publicViewLink } = req.body

    const project = await Project.findOne({ _id: req.params.id, createdBy: userId })
      .populate('createdBy', 'firstName lastName email')
      .populate('clientId', 'firstName lastName email company')
    
    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    // Check if client has email
    if (!project.clientId || !project.clientId.email) {
      return next(new AppError('Client email not found. Please ensure the client has a valid email address.', 400))
    }

    // Import email service
    const emailService = (await import('../utils/emailService.js')).default

    // Prepare milestone data for email (show only recent or important ones)
    const milestonesToInclude = includeMilestones && project.milestones 
      ? project.milestones
          .filter(m => m.status === 'completed' || new Date(m.dueDate) > Date.now())
          .slice(0, 5) // Limit to 5 most relevant milestones
      : []

    // Send actual email to client
    const emailResult = await emailService.sendProjectNotificationEmail({
      to: project.clientId.email,
      clientName: `${project.clientId.firstName} ${project.clientId.lastName}`.trim(),
      projectName: project.name,
      message: message,
      projectProgress: includeProgress ? (project.progress || 0) : undefined,
      projectStatus: project.status,
      milestones: milestonesToInclude,
      publicViewLink: publicViewLink,
      senderName: `${project.createdBy.firstName} ${project.createdBy.lastName}`.trim()
    })

    if (!emailResult.success) {
      return next(new AppError(`Failed to send email: ${emailResult.error}`, 500))
    }

    // Add notification to project notes
    project.notes.push({
      content: `Client notified via email (${project.clientId.email}): ${message}`,
      type: 'general',
      createdBy: userId
    })

    await project.save()

    res.json({
      success: true,
      message: 'Client notification sent successfully',
      data: { 
        emailSent: true,
        recipientEmail: project.clientId.email,
        clientName: `${project.clientId.firstName} ${project.clientId.lastName}`.trim(),
        previewUrl: emailResult.previewUrl // For development testing
      }
    })
  } catch (error) {
    console.error('Error sending client notification:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message)
      return next(new AppError(`Validation error: ${errors.join(', ')}`, 400))
    }
    
    next(new AppError(`Failed to send notification: ${error.message}`, 500))
  }
})

export default router