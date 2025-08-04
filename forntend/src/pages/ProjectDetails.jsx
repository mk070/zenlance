import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  ChevronRight,
  FolderOpen,
  Building2,
  Calendar,
  DollarSign,
  Users,
  Target,
  Plus,
  Edit3,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Trash2,
  MessageCircle,
  Paperclip,
  User,
  TrendingUp,
  BarChart3,
  FileText,
  Activity,
  Mail,
  Phone,
  UserPlus,
  Settings,
  Filter,
  Search,
  ChevronDown,
  Star,
  Calendar as CalendarIcon,
  Flag,
  Tag,
  Link as LinkIcon,
  Download,
  Upload
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const ProjectDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [showProgressEdit, setShowProgressEdit] = useState(false)
  const [showClientNotification, setShowClientNotification] = useState(false)
  const [taskText, setTaskText] = useState('')
  const [noteText, setNoteText] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [taskFilter, setTaskFilter] = useState('all')
  const [taskSearch, setTaskSearch] = useState('')
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [notificationText, setNotificationText] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: '',
    priority: '',
    startDate: '',
    endDate: '',
    budget: '',
    clientId: '',
    tags: [],
    notes: '',
    category: '',
    estimatedHours: '',
    hourlyRate: ''
  })

  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    estimatedHours: '',
    assignedTo: ''
  })

  const [teamFormData, setTeamFormData] = useState({
    email: '',
    role: 'developer',
    permissions: ['read']
  })

  const [milestoneFormData, setMilestoneFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    status: 'pending'
  })

  const [progressData, setProgressData] = useState({
    progress: 0,
    status: 'draft'
  })

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'text-gray-400 bg-gray-400/10' },
    { value: 'proposal', label: 'Proposal', color: 'text-blue-400 bg-blue-400/10' },
    { value: 'contracted', label: 'Contracted', color: 'text-purple-400 bg-purple-400/10' },
    { value: 'in_progress', label: 'In Progress', color: 'text-emerald-400 bg-emerald-400/10' },
    { value: 'on_hold', label: 'On Hold', color: 'text-orange-400 bg-orange-400/10' },
    { value: 'completed', label: 'Completed', color: 'text-green-400 bg-green-400/10' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-red-400 bg-red-400/10' }
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-gray-400' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { value: 'high', label: 'High', color: 'text-orange-400' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-400' }
  ]

  const roleOptions = [
    { value: 'owner', label: 'Owner' },
    { value: 'manager', label: 'Manager' },
    { value: 'developer', label: 'Developer' },
    { value: 'designer', label: 'Designer' },
    { value: 'tester', label: 'Tester' },
    { value: 'client', label: 'Client' }
  ]

  const permissionOptions = [
    { value: 'read', label: 'Read' },
    { value: 'write', label: 'Write' },
    { value: 'delete', label: 'Delete' },
    { value: 'manage', label: 'Manage' }
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderOpen },
    { id: 'tasks', label: 'Tasks', icon: Target },
    { id: 'milestones', label: 'Milestones', icon: Flag },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'notes', label: 'Notes', icon: MessageCircle }
  ]

  // Load clients data
  useEffect(() => {
    const loadClients = async () => {
      try {
        const result = await apiClient.getClients({ limit: 100 })
        if (result.success) {
          setClients(result.data)
        }
      } catch (error) {
        console.error('Error loading clients:', error)
      }
    }
    
    loadClients()
  }, [])

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true)
        const result = await apiClient.getProject(id)
        
        if (result.success) {
          setProject(result.data)
          setFormData({
            name: result.data.name || '',
            description: result.data.description || '',
            status: result.data.status || 'draft',
            priority: result.data.priority || 'medium',
            startDate: result.data.startDate ? result.data.startDate.split('T')[0] : '',
            endDate: result.data.endDate ? result.data.endDate.split('T')[0] : '',
            budget: result.data.budget || '',
            clientId: result.data.clientId?._id || result.data.clientId || undefined,
            tags: result.data.tags || [],
            notes: result.data.notes || '',
            category: result.data.category || '',
            estimatedHours: result.data.estimatedHours || '',
            hourlyRate: result.data.hourlyRate || ''
          })
          
          // Initialize progress data
          setProgressData({
            progress: result.data.progress || 0,
            status: result.data.status || 'draft'
          })
        } else {
          toast.error('Failed to load project details')
          navigate('/projects')
        }
      } catch (error) {
        console.error('Error loading project:', error)
        
        let errorMessage = 'Failed to load project details'
        if (error.message && error.message !== '[object Object]') {
          errorMessage = error.message
        } else if (error.data?.error) {
          errorMessage = error.data.error
        } else if (error.data?.message) {
          errorMessage = error.data.message
        }
        
        toast.error(errorMessage)
        navigate('/projects')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadProject()
    }
  }, [id, navigate])

  const handleInputChange = (field, value) => {
    if (field === 'tags' && typeof value === 'string') {
      const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag)
      setFormData(prev => ({ ...prev, tags }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Clean the form data - remove empty strings and undefined values
      const cleanedData = { ...formData }
      
      // Remove empty clientId to prevent validation errors
      if (!cleanedData.clientId || cleanedData.clientId === '') {
        delete cleanedData.clientId
      }
      
      // Remove other empty fields that shouldn't be sent
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '' || cleanedData[key] === null || cleanedData[key] === undefined) {
          delete cleanedData[key]
        }
      })
      
      const result = await apiClient.updateProject(id, cleanedData)
      
      if (result.success) {
        setProject(result.data)
        setIsEditing(false)
        toast.success('Project updated successfully!')
      } else {
        toast.error(result.error || 'Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      
      let errorMessage = 'Failed to update project'
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.data?.message) {
        errorMessage = error.data.message
      } else if (error?.message && error.message !== '[object Object]') {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleAddTask = async () => {
    if (!taskFormData.title.trim()) return

    try {
      const result = await apiClient.addProjectTask(id, {
        title: taskFormData.title.trim(),
        description: taskFormData.description.trim(),
        status: 'pending',
        priority: taskFormData.priority,
        dueDate: taskFormData.dueDate || undefined,
        estimatedHours: taskFormData.estimatedHours ? parseFloat(taskFormData.estimatedHours) : undefined,
        assignedTo: taskFormData.assignedTo || undefined
      })

      if (result.success) {
        setProject(prev => ({
          ...prev,
          tasks: [...(prev.tasks || []), result.data]
        }))
        setTaskFormData({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: '',
          estimatedHours: '',
          assignedTo: ''
        })
        setShowTaskForm(false)
        toast.success('Task added successfully!')
      } else {
        toast.error('Failed to add task')
      }
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task')
    }
  }

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      const result = await apiClient.updateProjectTask(id, taskId, { status })
      
      if (result.success) {
        setProject(prev => ({
          ...prev,
          tasks: prev.tasks?.map(task => 
            task._id === taskId ? { ...task, status } : task
          ) || []
        }))
        toast.success('Task updated successfully!')
      } else {
        toast.error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      const result = await apiClient.deleteProjectTask(id, taskId)
      
      if (result.success) {
        setProject(prev => ({
          ...prev,
          tasks: prev.tasks?.filter(task => task._id !== taskId) || []
        }))
        toast.success('Task deleted successfully!')
      } else {
        toast.error('Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return

    try {
      const result = await apiClient.addProjectNote(id, {
        content: noteText.trim(),
        type: 'general'
      })

      if (result.success) {
        setProject(prev => ({
          ...prev,
          notes: [...(prev.notes || []), result.data]
        }))
        setNoteText('')
        setShowNoteForm(false)
        toast.success('Note added successfully!')
      } else {
        toast.error('Failed to add note')
      }
    } catch (error) {
      console.error('Error adding note:', error)
      toast.error('Failed to add note')
    }
  }

  // Team management functions would require backend support
  const handleAddTeamMember = async () => {
    if (!teamFormData.email.trim()) return
    
    try {
      // This would need to be implemented in the backend
      toast.info('Team member management feature will be available soon')
      setShowTeamForm(false)
    } catch (error) {
      console.error('Error adding team member:', error)
      toast.error('Failed to add team member')
    }
  }

  const handleRemoveTeamMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this team member?')) {
      return
    }
    
    try {
      // This would need to be implemented in the backend
      toast.info('Team member management feature will be available soon')
    } catch (error) {
      console.error('Error removing team member:', error)
      toast.error('Failed to remove team member')
    }
  }

  // Milestone management functions
  const handleAddMilestone = async () => {
    if (!milestoneFormData.title.trim()) return

    try {
      const result = await apiClient.addProjectMilestone(id, {
        title: milestoneFormData.title.trim(),
        description: milestoneFormData.description.trim(),
        dueDate: milestoneFormData.dueDate || undefined,
        status: milestoneFormData.status
      })

      if (result.success) {
        setProject(prev => ({
          ...prev,
          milestones: [...(prev.milestones || []), result.data]
        }))
        setMilestoneFormData({
          title: '',
          description: '',
          dueDate: '',
          status: 'pending'
        })
        setShowMilestoneForm(false)
        toast.success('Milestone added successfully!')
      } else {
        toast.error('Failed to add milestone')
      }
    } catch (error) {
      console.error('Error adding milestone:', error)
      toast.error('Failed to add milestone')
    }
  }

  const handleUpdateMilestone = async (milestoneId, milestoneData) => {
    try {
      const result = await apiClient.updateProjectMilestone(id, milestoneId, milestoneData)
      
      if (result.success) {
        setProject(prev => ({
          ...prev,
          milestones: prev.milestones?.map(milestone => 
            milestone._id === milestoneId ? { ...milestone, ...milestoneData } : milestone
          ) || []
        }))
        setEditingMilestone(null)
        toast.success('Milestone updated successfully!')
      } else {
        toast.error('Failed to update milestone')
      }
    } catch (error) {
      console.error('Error updating milestone:', error)
      toast.error('Failed to update milestone')
    }
  }

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone?')) {
      return
    }

    try {
      const result = await apiClient.deleteProjectMilestone(id, milestoneId)
      
      if (result.success) {
        setProject(prev => ({
          ...prev,
          milestones: prev.milestones?.filter(milestone => milestone._id !== milestoneId) || []
        }))
        toast.success('Milestone deleted successfully!')
      } else {
        toast.error('Failed to delete milestone')
      }
    } catch (error) {
      console.error('Error deleting milestone:', error)
      toast.error('Failed to delete milestone')
    }
  }

  // Progress management function
  const handleUpdateProgress = async () => {
    try {
      // Use the general updateProject method instead of separate calls
      const result = await apiClient.updateProject(id, {
        progress: progressData.progress,
        status: progressData.status
      })
      
      if (result.success) {
        setProject(result.data)
        setFormData(prev => ({
          ...prev,
          status: result.data.status
        }))
        setShowProgressEdit(false)
        toast.success('Progress updated successfully!')
      } else {
        toast.error('Failed to update progress')
      }
    } catch (error) {
      console.error('Error updating progress:', error)
      
      let errorMessage = 'Failed to update progress'
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.data?.message) {
        errorMessage = error.data.message
      } else if (error?.message && error.message !== '[object Object]') {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    }
  }

  // Client notification function
  const handleNotifyClient = async () => {
    if (!notificationText.trim()) {
      toast.error('Please enter a notification message')
      return
    }

    try {
      const result = await apiClient.notifyClient(id, {
        message: notificationText.trim(),
        includeProgress: true,
        includeMilestones: true,
        publicViewLink: `${window.location.origin}/public/projects/${id}`
      })

      if (result.success) {
        setNotificationText('')
        setShowClientNotification(false)
        
        // Show detailed success message with client email
        const clientEmail = result.data?.recipientEmail || 'client'
        const clientName = result.data?.clientName || 'client'
        toast.success(`Email sent successfully to ${clientName} (${clientEmail})!`)
        
        // In development, log the preview URL
        if (result.data?.previewUrl) {
          console.log('📧 Email preview:', result.data.previewUrl)
        }
      } else {
        toast.error('Failed to notify client')
      }
    } catch (error) {
      console.error('Error notifying client:', error)
      
      let errorMessage = 'Failed to notify client'
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error?.data?.message) {
        errorMessage = error.data.message
      } else if (error?.message && error.message !== '[object Object]') {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    }
  }

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption ? statusOption.color : 'text-gray-400 bg-gray-400/10'
  }

  const getPriorityColor = (priority) => {
    const priorityOption = priorityOptions.find(opt => opt.value === priority)
    return priorityOption ? priorityOption.color : 'text-gray-400'
  }

  const calculateProgress = () => {
    if (!project?.tasks || project.tasks.length === 0) return 0
    const completedTasks = project.tasks.filter(task => task.status === 'completed').length
    return Math.round((completedTasks / project.tasks.length) * 100)
  }

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'in_progress':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'blocked':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getTaskPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'high':
        return <Flag className="w-4 h-4 text-orange-400" />
      case 'medium':
        return <Flag className="w-4 h-4 text-yellow-400" />
      case 'low':
        return <Flag className="w-4 h-4 text-gray-400" />
      default:
        return <Flag className="w-4 h-4 text-gray-400" />
    }
  }

  const filteredTasks = project?.tasks?.filter(task => {
    const matchesFilter = taskFilter === 'all' || task.status === taskFilter
    const matchesSearch = task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(taskSearch.toLowerCase()))
    return matchesFilter && matchesSearch
  }) || []

  const getTimelineEvents = () => {
    if (!project) return []
    
    const events = []
    
    // Project milestones
    if (project.startDate) {
      events.push({
        date: new Date(project.startDate),
        type: 'start',
        title: 'Project Started',
        description: 'Project work commenced'
      })
    }
    
    if (project.endDate) {
      events.push({
        date: new Date(project.endDate),
        type: 'end',
        title: 'Project Deadline',
        description: 'Scheduled completion date'
      })
    }
    
    // Task completions
    project.tasks?.forEach(task => {
      if (task.completedAt) {
        events.push({
          date: new Date(task.completedAt),
          type: 'task',
          title: `Task Completed: ${task.title}`,
          description: task.description || 'Task completed successfully'
        })
      }
    })
    
    // Notes as events
    project.notes?.forEach(note => {
      events.push({
        date: new Date(note.createdAt),
        type: 'note',
        title: 'Note Added',
        description: note.content
      })
    })
    
    return events.sort((a, b) => b.date - a.date)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Project not found</h3>
          <p className="text-slate-400 mb-6">The project you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all duration-200"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Breadcrumbs */}
      <div className="border-b border-gray-800/50 bg-black/40 backdrop-blur-xl">
        <div className="px-8 py-6">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-sm text-slate-400 mb-4">
            <button
              onClick={() => navigate('/projects')}
              className="hover:text-white transition-colors"
            >
              Projects
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{project.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/projects')}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-2xl font-light text-white">{project.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(project.status)}`}>
                    <span className="capitalize">{project.status?.replace('_', ' ')}</span>
                  </div>
                  <div className={`text-sm font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority?.toUpperCase()} PRIORITY
                  </div>
                  {project.category && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 rounded-full text-xs text-slate-300">
                      <Tag className="w-3 h-3" />
                      <span>{project.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowClientNotification(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 rounded-xl font-medium hover:from-emerald-400 hover:to-green-400 transition-all duration-200"
              >
                <Mail className="w-4 h-4" />
                <span>Notify Client</span>
              </button>
              
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Project Progress</span>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-slate-400">{project?.progress || calculateProgress()}% Complete</span>
              <button
                onClick={() => {
                  setProgressData({
                    progress: project?.progress || calculateProgress(),
                    status: project?.status || 'draft'
                  })
                  setShowProgressEdit(true)
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
          <div 
            className="w-full bg-slate-800/50 rounded-full h-2 cursor-pointer hover:bg-slate-800/70 transition-colors"
            onClick={() => {
              setProgressData({
                progress: project?.progress || calculateProgress(),
                status: project?.status || 'draft'
              })
              setShowProgressEdit(true)
            }}
          >
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project?.progress || calculateProgress()}%` }}
            ></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8">
          <div className="flex space-x-1 bg-black/20 p-1 rounded-xl w-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white/10 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Client Details */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-medium text-white">Client Information</h3>
              </div>
              {project.clientId ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-400">Name:</span>
                    <p className="text-white font-medium">
                      {project.clientId.firstName} {project.clientId.lastName}
                    </p>
                  </div>
                  {project.clientId.email && (
                    <div>
                      <span className="text-slate-400">Email:</span>
                      <p className="text-blue-400">{project.clientId.email}</p>
                    </div>
                  )}
                  {project.clientId.company && (
                    <div>
                      <span className="text-slate-400">Company:</span>
                      <p className="text-white">{project.clientId.company}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-400 mb-3">No client assigned to this project</p>
                  {isEditing && (
                    <p className="text-xs text-slate-500">You can assign a client by editing the project details</p>
                  )}
                </div>
              )}
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-medium text-slate-300">Tasks</span>
                </div>
                <div className="text-2xl font-semibold text-white">
                  {project.tasks?.length || 0}
                </div>
                <div className="text-sm text-slate-400">
                  {project.tasks?.filter(t => t.status === 'completed').length || 0} completed
                </div>
              </div>

              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-medium text-slate-300">Team</span>
                </div>
                <div className="text-2xl font-semibold text-white">
                  {project.teamMembers?.length || 0}
                </div>
                <div className="text-sm text-slate-400">members</div>
              </div>

              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium text-slate-300">Budget</span>
                </div>
                <div className="text-2xl font-semibold text-white">
                  ${project.budget?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-slate-400">allocated</div>
              </div>

              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-slate-300">Hours</span>
                </div>
                <div className="text-2xl font-semibold text-white">
                  {project.estimatedHours || '—'}
                </div>
                <div className="text-sm text-slate-400">estimated</div>
              </div>
            </div>

            {/* Project Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-6">Project Information</h3>
                
                <div className="space-y-6">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Client</label>
                        <select
                          value={formData.clientId || ''}
                          onChange={(e) => handleInputChange('clientId', e.target.value || undefined)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                        >
                          <option value="" className="bg-slate-800">No client assigned</option>
                          {clients && Array.isArray(clients) && clients.map((client) => (
                            <option key={client._id} value={client._id} className="bg-slate-800">
                              {client.firstName} {client.lastName} {client.company && `(${client.company})`}
                            </option>
                          ))}
                        </select>
                        {clients.length === 0 && (
                          <p className="text-xs text-amber-400 mt-1">
                            Loading clients...
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value} className="bg-slate-800">
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                          <select
                            value={formData.priority}
                            onChange={(e) => handleInputChange('priority', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                          >
                            {priorityOptions.map((option) => (
                              <option key={option.value} value={option.value} className="bg-slate-800">
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          placeholder="e.g., Web Development, Mobile App"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
                        <input
                          type="text"
                          value={formData.tags.join(', ')}
                          onChange={(e) => handleInputChange('tags', e.target.value)}
                          placeholder="Enter tags separated by commas"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                        <p className="text-white">
                          {project.description || 'No description provided'}
                        </p>
                      </div>
                      
                      {project.clientId && (
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-400">Client:</span>
                          <span className="text-white">
                            {project.clientId.firstName} {project.clientId.lastName} 
                            {project.clientId.company && ` (${project.clientId.company})`}
                          </span>
                        </div>
                      )}

                      {project.category && (
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-400">Category:</span>
                          <span className="text-white">{project.category}</span>
                        </div>
                      )}

                      {project.tags && project.tags.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Tags</label>
                          <div className="flex flex-wrap gap-2">
                            {project.tags && project.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm text-slate-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Timeline and Budget */}
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-6">Timeline & Budget</h3>
                
                <div className="space-y-6">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => handleInputChange('endDate', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Budget</label>
                        <input
                          type="number"
                          value={formData.budget}
                          onChange={(e) => handleInputChange('budget', e.target.value)}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Hours</label>
                          <input
                            type="number"
                            value={formData.estimatedHours}
                            onChange={(e) => handleInputChange('estimatedHours', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                            placeholder="0"
                            min="0"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Hourly Rate</label>
                          <input
                            type="number"
                            value={formData.hourlyRate}
                            onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Start Date</span>
                          <span className="text-white">
                            {project.startDate 
                              ? new Date(project.startDate).toLocaleDateString()
                              : 'Not set'
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">End Date</span>
                          <span className="text-white">
                            {project.endDate 
                              ? new Date(project.endDate).toLocaleDateString()
                              : 'Not set'
                            }
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Budget</span>
                        <span className="text-emerald-400 font-semibold">
                          ${project.budget?.toLocaleString() || '0.00'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Est. Hours</span>
                          <span className="text-white">
                            {project.estimatedHours || '—'}h
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Hourly Rate</span>
                          <span className="text-white">
                            ${project.hourlyRate || '—'}/h
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Created</span>
                        <span className="text-white">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {project.startDate && project.endDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">Duration</span>
                          <span className="text-white">
                            {Math.ceil((new Date(project.endDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Task Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-medium text-white">Tasks</h2>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <span>{filteredTasks.length} of {project.tasks?.length || 0} tasks</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 w-48"
                  />
                </div>
                
                {/* Filter */}
                <select
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                >
                  <option value="all" className="bg-slate-800">All Tasks</option>
                  <option value="pending" className="bg-slate-800">Pending</option>
                  <option value="in_progress" className="bg-slate-800">In Progress</option>
                  <option value="completed" className="bg-slate-800">Completed</option>
                  <option value="blocked" className="bg-slate-800">Blocked</option>
                </select>

                <button
                  onClick={() => setShowTaskForm(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-4">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                  >
                    <div className="flex items-start space-x-4">
                      <button
                        onClick={() => handleUpdateTaskStatus(
                          task._id, 
                          task.status === 'completed' ? 'pending' : 'completed'
                        )}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 mt-1 flex-shrink-0 ${
                          task.status === 'completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-400 hover:border-emerald-400'
                        }`}
                      >
                        {task.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className={`font-medium ${
                                task.status === 'completed' 
                                  ? 'text-slate-400 line-through' 
                                  : 'text-white'
                              }`}>
                                {task.title}
                              </h4>
                              {getTaskPriorityIcon(task.priority)}
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                                <span className="capitalize">{task.status.replace('_', ' ')}</span>
                              </div>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-slate-400 mb-3">{task.description}</p>
                            )}
                            
                            <div className="flex items-center space-x-6 text-sm text-slate-400">
                              {task.dueDate && (
                                <div className="flex items-center space-x-1">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                </div>
                              )}
                              
                              {task.estimatedHours && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{task.estimatedHours}h estimated</span>
                                </div>
                              )}
                              
                              {task.assignedTo && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-4 h-4" />
                                  <span>
                                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    {taskSearch || taskFilter !== 'all' ? 'No matching tasks' : 'No tasks yet'}
                  </h3>
                  <p className="text-slate-400 mb-6">
                    {taskSearch || taskFilter !== 'all' 
                      ? 'Try adjusting your search or filter'
                      : 'Add tasks to track project progress'
                    }
                  </p>
                  {(!taskSearch && taskFilter === 'all') && (
                    <button
                      onClick={() => setShowTaskForm(true)}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
                    >
                      Add First Task
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Add Task Modal */}
            {showTaskForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                  className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-lg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-white">Add New Task</h3>
                    <button
                      onClick={() => setShowTaskForm(false)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Task Title *</label>
                      <input
                        type="text"
                        value={taskFormData.title}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter task title"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                      <textarea
                        value={taskFormData.description}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Task description (optional)"
                        rows={3}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                        <select
                          value={taskFormData.priority}
                          onChange={(e) => setTaskFormData(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                        >
                          {priorityOptions.map((option) => (
                            <option key={option.value} value={option.value} className="bg-slate-800">
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
                        <input
                          type="date"
                          value={taskFormData.dueDate}
                          onChange={(e) => setTaskFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Estimated Hours</label>
                      <input
                        type="number"
                        value={taskFormData.estimatedHours}
                        onChange={(e) => setTaskFormData(prev => ({ ...prev, estimatedHours: e.target.value }))}
                        placeholder="0"
                        min="0"
                        step="0.5"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => setShowTaskForm(false)}
                        className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddTask}
                        disabled={!taskFormData.title.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Task
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-white">Project Milestones</h2>
              <button
                onClick={() => setShowMilestoneForm(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Milestone</span>
              </button>
            </div>

            <div className="space-y-4">
              {project?.milestones && project.milestones.length > 0 ? (
                project.milestones && project.milestones.map((milestone) => (
                  <div key={milestone._id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-white">{milestone.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            milestone.status === 'completed' ? 'bg-emerald-400/20 text-emerald-400' :
                            milestone.status === 'overdue' ? 'bg-red-400/20 text-red-400' :
                            'bg-yellow-400/20 text-yellow-400'
                          }`}>
                            {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                          </span>
                        </div>
                        
                        {milestone.description && (
                          <p className="text-slate-300 mb-3">{milestone.description}</p>
                        )}
                        
                        {milestone.dueDate && (
                          <div className="flex items-center space-x-2 text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingMilestone(milestone)
                            setMilestoneFormData({
                              title: milestone.title,
                              description: milestone.description || '',
                              dueDate: milestone.dueDate ? milestone.dueDate.split('T')[0] : '',
                              status: milestone.status
                            })
                            setShowMilestoneForm(true)
                          }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteMilestone(milestone._id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Flag className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No milestones yet</h3>
                  <p className="text-slate-400 mb-6">Set key milestones to track important project goals</p>
                  <button
                    onClick={() => setShowMilestoneForm(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Milestone
                  </button>
                </div>
              )}
            </div>

            {/* Add Milestone Modal */}
            {showMilestoneForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-white">
                      {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowMilestoneForm(false)
                        setEditingMilestone(null)
                        setMilestoneFormData({ title: '', description: '', dueDate: '', status: 'pending' })
                      }}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                      <input
                        type="text"
                        value={milestoneFormData.title}
                        onChange={(e) => setMilestoneFormData({...milestoneFormData, title: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Milestone title..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                      <textarea
                        value={milestoneFormData.description}
                        onChange={(e) => setMilestoneFormData({...milestoneFormData, description: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        rows={3}
                        placeholder="Milestone description..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
                      <input
                        type="date"
                        value={milestoneFormData.dueDate}
                        onChange={(e) => setMilestoneFormData({...milestoneFormData, dueDate: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                      <select
                        value={milestoneFormData.status}
                        onChange={(e) => setMilestoneFormData({...milestoneFormData, status: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowMilestoneForm(false)
                        setEditingMilestone(null)
                        setMilestoneFormData({ title: '', description: '', dueDate: '', status: 'pending' })
                      }}
                      className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingMilestone ? 
                        () => handleUpdateMilestone(editingMilestone._id, milestoneFormData) :
                        handleAddMilestone
                      }
                      disabled={!milestoneFormData.title.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {editingMilestone ? 'Update Milestone' : 'Add Milestone'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-white">Project Timeline</h2>
              <div className="text-sm text-slate-400">
                {getTimelineEvents().length} events
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
              {getTimelineEvents().length > 0 ? (
                getTimelineEvents().map((event, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        event.type === 'start' ? 'bg-emerald-400' :
                        event.type === 'end' ? 'bg-red-400' :
                        event.type === 'task' ? 'bg-blue-400' :
                        'bg-yellow-400'
                      }`}></div>
                      {index < getTimelineEvents().length - 1 && (
                        <div className="w-px h-16 bg-slate-700 mt-2"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 pb-8">
                      <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-white">{event.title}</h4>
                          <span className="text-sm text-slate-400">
                            {event.date.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">{event.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Timeline Events</h3>
                  <p className="text-slate-400">
                    Add tasks, notes, or set project dates to see timeline events
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-white">Team Members</h2>
              <button
                onClick={() => setShowTeamForm(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Member</span>
              </button>
            </div>

            {/* Team List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.teamMembers && project.teamMembers.length > 0 ? (
                project.teamMembers && project.teamMembers.map((member) => (
                  <div
                    key={member._id}
                    className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">
                          {member.userId?.firstName} {member.userId?.lastName}
                        </h4>
                        <p className="text-sm text-slate-400 capitalize">{member.role}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveTeamMember(member._id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {member.userId?.email && (
                      <div className="flex items-center space-x-2 text-sm text-slate-400 mb-2">
                        <Mail className="w-4 h-4" />
                        <span>{member.userId.email}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-sm text-slate-400 mb-3">
                      <Settings className="w-4 h-4" />
                      <span>Permissions: {member.permissions?.join(', ') || 'None'}</span>
                    </div>

                    <div className="text-xs text-slate-500">
                      Added: {new Date(member.addedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No team members yet</h3>
                  <p className="text-slate-400 mb-6">Invite team members to collaborate on this project</p>
                  <button
                    onClick={() => setShowTeamForm(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
                  >
                    Add First Member
                  </button>
                </div>
              )}
            </div>

            {/* Add Team Member Modal */}
            {showTeamForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                  className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-white">Add Team Member</h3>
                    <button
                      onClick={() => setShowTeamForm(false)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={teamFormData.email}
                        onChange={(e) => setTeamFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="team.member@example.com"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                      <select
                        value={teamFormData.role}
                        onChange={(e) => setTeamFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-slate-800">
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Permissions</label>
                      <div className="space-y-2">
                        {permissionOptions.map((permission) => (
                          <label key={permission.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={teamFormData.permissions.includes(permission.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTeamFormData(prev => ({
                                    ...prev,
                                    permissions: [...prev.permissions, permission.value]
                                  }))
                                } else {
                                  setTeamFormData(prev => ({
                                    ...prev,
                                    permissions: prev.permissions.filter(p => p !== permission.value)
                                  }))
                                }
                              }}
                              className="w-4 h-4 text-cyan-500 border-white/20 rounded focus:ring-cyan-400/50 bg-white/5"
                            />
                            <span className="text-sm text-slate-300">{permission.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => setShowTeamForm(false)}
                        className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddTeamMember}
                        disabled={!teamFormData.email.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Member
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-6">
            {/* Add Note Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-white">Project Notes</h2>
              <button
                onClick={() => setShowNoteForm(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Note</span>
              </button>
            </div>

            {/* Notes List */}
            <div className="space-y-4">
              {project.notes && project.notes.length > 0 ? (
                project.notes && project.notes.map((note) => (
                  <div
                    key={note._id}
                    className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">
                            {note.createdBy?.firstName} {note.createdBy?.lastName}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(note.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-300 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No notes yet</h3>
                  <p className="text-slate-400 mb-6">Add notes to keep track of important information</p>
                  <button
                    onClick={() => setShowNoteForm(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
                  >
                    Add First Note
                  </button>
                </div>
              )}
            </div>

            {/* Add Note Modal */}
            {showNoteForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                  className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Add Note</h3>
                    <button
                      onClick={() => setShowNoteForm(false)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Enter your note..."
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none"
                    />

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setShowNoteForm(false)}
                        className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddNote}
                        disabled={!noteText.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
                      )}
        </div>
      )}

      {/* Progress Edit Modal */}
      {showProgressEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Update Progress & Status</h3>
              <button
                onClick={() => setShowProgressEdit(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Progress ({progressData.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressData.progress}
                  onChange={(e) => setProgressData({...progressData, progress: parseInt(e.target.value)})}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Project Status</label>
                <select
                  value={progressData.status}
                  onChange={(e) => setProgressData({...progressData, status: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value} className="bg-slate-800">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowProgressEdit(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProgress}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
              >
                Update Progress
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Client Notification Modal */}
      {showClientNotification && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Notify Client</h3>
              <button
                onClick={() => setShowClientNotification(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Message to Client</label>
                <textarea
                  value={notificationText}
                  onChange={(e) => setNotificationText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  rows={4}
                  placeholder="Enter a message to include with the project update..."
                />
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-white mb-2">What will be included:</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Current project progress ({project?.progress || calculateProgress()}%)</li>
                  <li>• Project status ({project?.status?.replace('_', ' ') || 'Unknown'})</li>
                  <li>• Recent milestones</li>
                  <li>• Public project view link</li>
                </ul>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <div className="flex items-start space-x-2">
                  <LinkIcon className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-400">Public Project View</p>
                    <p className="text-xs text-slate-400">
                      {window.location.origin}/public/projects/{id}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowClientNotification(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNotifyClient}
                disabled={!notificationText.trim()}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-medium hover:from-emerald-400 hover:to-green-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Notification
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  </div>
  )
}

export default ProjectDetails 