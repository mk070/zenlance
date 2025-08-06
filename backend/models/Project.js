import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'blocked'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
})

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['general', 'meeting', 'issue', 'milestone'],
    default: 'general'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number
  }]
}, {
  timestamps: true
})

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'overdue'],
    default: 'pending'
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
})

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Enhanced requirements structure (carried from leads)
  requirements: {
    scope: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['draft', 'proposal', 'contracted', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  budget: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Client information
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  clientName: {
    type: String,
    trim: true
  },
  
  // Team and collaboration
  teamMembers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'manager', 'developer', 'designer', 'tester', 'client'],
      default: 'developer'
    },
    permissions: {
      type: [String],
      default: ['read']
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Project organization
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true
  },
  
  // Project content
  tasks: [taskSchema],
  notes: [noteSchema],
  milestones: [milestoneSchema],
  
  // Financial tracking
  hoursLogged: {
    type: Number,
    default: 0,
    min: 0
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  hourlyRate: {
    type: Number,
    min: 0
  },
  
  // Progress tracking
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Project settings
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    trackTime: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Archive/deletion
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes for performance
projectSchema.index({ createdBy: 1, status: 1 })
projectSchema.index({ clientId: 1 })
projectSchema.index({ startDate: 1, endDate: 1 })
projectSchema.index({ tags: 1 })
projectSchema.index({ name: 'text', description: 'text' })

// Virtual for calculated progress based on tasks
projectSchema.virtual('calculatedProgress').get(function() {
  if (!this.tasks || this.tasks.length === 0) return 0
  const completedTasks = this.tasks.filter(task => task.status === 'completed').length
  return Math.round((completedTasks / this.tasks.length) * 100)
})

// Virtual for project duration in days
projectSchema.virtual('durationDays').get(function() {
  if (!this.startDate || !this.endDate) return null
  const diffTime = Math.abs(this.endDate - this.startDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

// Virtual for overdue status
projectSchema.virtual('isOverdue').get(function() {
  if (!this.endDate) return false
  return this.endDate < new Date() && this.status !== 'completed'
})

// Methods
projectSchema.methods.updateProgress = function() {
  this.progress = this.calculatedProgress
  // Don't auto-save - let the caller handle saving
  return this
}

projectSchema.methods.addTeamMember = function(userId, role = 'developer', permissions = ['read']) {
  const existingMember = this.teamMembers.find(member => 
    member.userId.toString() === userId.toString()
  )
  
  if (existingMember) {
    existingMember.role = role
    existingMember.permissions = permissions
  } else {
    this.teamMembers.push({ userId, role, permissions })
  }
  
  return this.save()
}

projectSchema.methods.removeTeamMember = function(userId) {
  this.teamMembers = this.teamMembers.filter(member => 
    member.userId.toString() !== userId.toString()
  )
  return this.save()
}

projectSchema.methods.addTask = function(taskData) {
  this.tasks.push(taskData)
  this.updateProgress()
  // Don't auto-save - let the caller handle saving
  return this
}

projectSchema.methods.updateTask = function(taskId, updates) {
  const task = this.tasks.id(taskId)
  if (!task) {
    throw new Error('Task not found')
  }
  
  Object.assign(task, updates)
  
  if (updates.status === 'completed' && !task.completedAt) {
    task.completedAt = new Date()
  } else if (updates.status !== 'completed') {
    task.completedAt = undefined
  }
  
  this.updateProgress()
  // Don't auto-save - let the caller handle saving
  return this
}

projectSchema.methods.deleteTask = function(taskId) {
  this.tasks.id(taskId).remove()
  this.updateProgress()
  // Don't auto-save - let the caller handle saving
  return this
}

projectSchema.methods.addNote = function(noteData, userId) {
  noteData.createdBy = userId
  this.notes.push(noteData)
  return this.save()
}

// Static methods
projectSchema.statics.findByUser = function(userId, filters = {}) {
  const query = {
    $or: [
      { createdBy: userId },
      { 'teamMembers.userId': userId }
    ],
    archived: { $ne: true },
    ...filters
  }
  
  return this.find(query)
    .populate('createdBy', 'firstName lastName email')
    .populate('teamMembers.userId', 'firstName lastName email')
    .populate('clientId', 'name email')
    .sort({ updatedAt: -1 })
}

projectSchema.statics.getProjectStatistics = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { createdBy: new mongoose.Types.ObjectId(userId) },
          { 'teamMembers.userId': new mongoose.Types.ObjectId(userId) }
        ],
        archived: { $ne: true }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0]
          }
        },
        completed: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        totalBudget: { $sum: '$budget' },
        averageProgress: { $avg: '$progress' }
      }
    }
  ])
}

// Pre-save middleware
projectSchema.pre('save', function(next) {
  this.lastModifiedBy = this.createdBy
  next()
})

// Ensure virtual fields are serialized
projectSchema.set('toJSON', { virtuals: true })
projectSchema.set('toObject', { virtuals: true })

const Project = mongoose.model('Project', projectSchema)

export default Project