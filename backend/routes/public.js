import express from 'express'
import Project from '../models/Project.js'
import { AppError } from '../middleware/errorMiddleware.js'

const router = express.Router()

// GET /api/public/projects/:id - Public project view for clients
router.get('/projects/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email company')
      .select('-teamMembers -settings -archived -notes.content') // Hide sensitive data
    
    if (!project) {
      return next(new AppError('Project not found', 404))
    }

    // Filter milestones to only show completed ones and upcoming deadlines
    const filteredMilestones = project.milestones.filter(milestone => 
      milestone.status === 'completed' || 
      (milestone.dueDate && new Date(milestone.dueDate) > new Date())
    )

    // Filter tasks to only show completed ones
    const completedTasks = project.tasks.filter(task => task.status === 'completed')

    const publicProject = {
      _id: project._id,
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      currency: project.currency,
      clientName: project.clientName,
      category: project.category,
      completedTasks: completedTasks.length,
      totalTasks: project.tasks.length,
      milestones: filteredMilestones,
      createdBy: {
        name: `${project.createdBy.firstName} ${project.createdBy.lastName}`,
        email: project.createdBy.email,
        company: project.createdBy.company
      },
      lastUpdated: project.updatedAt
    }

    res.json({
      success: true,
      data: publicProject
    })
  } catch (error) {
    console.error('Error fetching public project:', error)
    next(new AppError('Failed to fetch project details', 500))
  }
})

// GET /api/public/projects/:id/html - Raw HTML view for email
router.get('/projects/:id/html', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email company')
    
    if (!project) {
      return res.status(404).send('<h1>Project Not Found</h1>')
    }

    const progressPercentage = project.progress || 0
    const completedTasks = project.tasks.filter(task => task.status === 'completed').length
    const totalTasks = project.tasks.length
    
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.name} - Project Status</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .content {
                padding: 30px;
            }
            .progress-bar {
                background: #e9ecef;
                border-radius: 8px;
                height: 20px;
                margin: 20px 0;
                overflow: hidden;
            }
            .progress-fill {
                background: linear-gradient(90deg, #28a745, #20c997);
                height: 100%;
                border-radius: 8px;
                transition: width 0.3s ease;
            }
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .status-completed { background: #d4edda; color: #155724; }
            .status-in_progress { background: #cce7ff; color: #004085; }
            .status-on_hold { background: #fff3cd; color: #856404; }
            .status-draft { background: #f8f9fa; color: #6c757d; }
            .milestone {
                background: #f8f9fa;
                border-left: 4px solid #667eea;
                margin: 15px 0;
                padding: 15px;
                border-radius: 0 8px 8px 0;
            }
            .milestone.completed {
                border-left-color: #28a745;
                background: #f0fff4;
            }
            .stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            .stat-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
            }
            .stat-number {
                font-size: 2em;
                font-weight: bold;
                color: #667eea;
                display: block;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px 30px;
                border-top: 1px solid #dee2e6;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
            }
            @media (max-width: 600px) {
                body { padding: 10px; }
                .content { padding: 20px; }
                .stats { grid-template-columns: 1fr; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${project.name}</h1>
                <p>${project.description || 'Project in progress'}</p>
                <span class="status-badge status-${project.status}">
                    ${project.status.replace('_', ' ').toUpperCase()}
                </span>
            </div>
            
            <div class="content">
                <h2>Project Progress</h2>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
                <p style="text-align: center; margin-top: 10px; font-weight: 600; color: #667eea;">
                    ${progressPercentage}% Complete
                </p>
                
                <div class="stats">
                    <div class="stat-card">
                        <span class="stat-number">${completedTasks}/${totalTasks}</span>
                        <div>Tasks Completed</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${project.milestones.filter(m => m.status === 'completed').length}</span>
                        <div>Milestones Reached</div>
                    </div>
                    ${project.budget ? `
                    <div class="stat-card">
                        <span class="stat-number">${project.currency} ${project.budget.toLocaleString()}</span>
                        <div>Project Budget</div>
                    </div>
                    ` : ''}
                </div>
                
                ${project.milestones.length > 0 ? `
                <h2>Recent Milestones</h2>
                ${project.milestones.slice(0, 5).map(milestone => `
                    <div class="milestone ${milestone.status}">
                        <h3 style="margin: 0 0 10px 0;">${milestone.title}</h3>
                        ${milestone.description ? `<p style="margin: 0 0 10px 0;">${milestone.description}</p>` : ''}
                        <small style="color: #6c757d;">
                            ${milestone.status === 'completed' ? '✅ Completed' : 
                              milestone.dueDate ? `📅 Due: ${new Date(milestone.dueDate).toLocaleDateString()}` : ''}
                        </small>
                    </div>
                `).join('')}
                ` : ''}
                
                ${project.startDate || project.endDate ? `
                <h2>Timeline</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    ${project.startDate ? `<p><strong>Start Date:</strong> ${new Date(project.startDate).toLocaleDateString()}</p>` : ''}
                    ${project.endDate ? `<p><strong>Target Completion:</strong> ${new Date(project.endDate).toLocaleDateString()}</p>` : ''}
                </div>
                ` : ''}
            </div>
            
            <div class="footer">
                <p>
                    <strong>Project Manager:</strong> ${project.createdBy.firstName} ${project.createdBy.lastName}<br>
                    <strong>Email:</strong> <a href="mailto:${project.createdBy.email}">${project.createdBy.email}</a><br>
                    <strong>Last Updated:</strong> ${new Date(project.updatedAt).toLocaleDateString()}
                </p>
            </div>
        </div>
    </body>
    </html>
    `

    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  } catch (error) {
    console.error('Error generating HTML view:', error)
    res.status(500).send('<h1>Error loading project</h1>')
  }
})

export default router 