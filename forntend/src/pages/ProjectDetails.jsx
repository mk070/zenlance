import { useState, useEffect } from 'react'
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
  Activity
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const ProjectDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [taskText, setTaskText] = useState('')
  const [noteText, setNoteText] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  
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
    notes: ''
  })

  const statusOptions = [
    { value: 'planning', label: 'Planning', color: 'text-yellow-400 bg-yellow-400/10' },
    { value: 'active', label: 'Active', color: 'text-emerald-400 bg-emerald-400/10' },
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FolderOpen },
    { id: 'tasks', label: 'Tasks', icon: Target },
    { id: 'timeline', label: 'Timeline', icon: Calendar },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'notes', label: 'Notes', icon: MessageCircle }
  ]

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
            status: result.data.status || 'planning',
            priority: result.data.priority || 'medium',
            startDate: result.data.startDate ? result.data.startDate.split('T')[0] : '',
            endDate: result.data.endDate ? result.data.endDate.split('T')[0] : '',
            budget: result.data.budget || '',
            clientId: result.data.clientId || '',
            tags: result.data.tags || [],
            notes: result.data.notes || ''
          })
        } else {
          toast.error('Failed to load project details')
          navigate('/projects')
        }
      } catch (error) {
        console.error('Error loading project:', error)
        
        // Show user-friendly error message
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
      const result = await apiClient.updateProject(id, formData)
      
      if (result.success) {
        setProject(result.data)
        setIsEditing(false)
        toast.success('Project updated successfully!')
      } else {
        toast.error(result.error || 'Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTask = async () => {
    if (!taskText.trim()) return

    try {
      const result = await apiClient.addProjectTask(id, {
        title: taskText.trim(),
        status: 'pending',
        priority: 'medium'
      })

      if (result.success) {
        setProject(prev => ({
          ...prev,
          tasks: [...(prev.tasks || []), result.data]
        }))
        setTaskText('')
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
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
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
            <span className="text-sm text-slate-400">{calculateProgress()}% Complete</span>
          </div>
          <div className="w-full bg-slate-800/50 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
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
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-slate-300">Duration</span>
                </div>
                <div className="text-2xl font-semibold text-white">
                  {project.startDate && project.endDate
                    ? Math.ceil((new Date(project.endDate) - new Date(project.startDate)) / (1000 * 60 * 60 * 24))
                    : '—'}
                </div>
                <div className="text-sm text-slate-400">days</div>
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
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                        <p className="text-white">
                          {project.description || 'No description provided'}
                        </p>
                      </div>
                      
                      {project.clientName && (
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-400">Client:</span>
                          <span className="text-white">{project.clientName}</span>
                        </div>
                      )}

                      {project.tags && project.tags.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Tags</label>
                          <div className="flex flex-wrap gap-2">
                            {project.tags.map((tag, index) => (
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

              {/* Timeline */}
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-6">Timeline</h3>
                
                <div className="space-y-6">
                  {isEditing ? (
                    <>
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
                    </>
                  ) : (
                    <>
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
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Budget</span>
                        <span className="text-emerald-400 font-semibold">
                          ${project.budget?.toLocaleString() || '0.00'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-400">Created</span>
                        <span className="text-white">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Add Task Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-white">Tasks</h2>
              <button
                onClick={() => setShowTaskForm(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Task List */}
            <div className="space-y-4">
              {project.tasks && project.tasks.length > 0 ? (
                project.tasks.map((task) => (
                  <div
                    key={task._id}
                    className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <button
                          onClick={() => handleUpdateTaskStatus(
                            task._id, 
                            task.status === 'completed' ? 'pending' : 'completed'
                          )}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                            task.status === 'completed'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-slate-400 hover:border-emerald-400'
                          }`}
                        >
                          {task.status === 'completed' && <CheckCircle className="w-4 h-4" />}
                        </button>
                        
                        <div className="flex-1">
                          <h4 className={`font-medium ${
                            task.status === 'completed' 
                              ? 'text-slate-400 line-through' 
                              : 'text-white'
                          }`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-slate-400 mt-1">{task.description}</p>
                          )}
                        </div>

                        <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                          <span className="capitalize">{task.status.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200 ml-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No tasks yet</h3>
                  <p className="text-slate-400 mb-6">Add tasks to track project progress</p>
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
                  >
                    Add First Task
                  </button>
                </div>
              )}
            </div>

            {/* Add Task Modal */}
            {showTaskForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <motion.div
                  className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-md"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Add New Task</h3>
                    <button
                      onClick={() => setShowTaskForm(false)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={taskText}
                      onChange={(e) => setTaskText(e.target.value)}
                      placeholder="Task title"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                    />

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setShowTaskForm(false)}
                        className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddTask}
                        disabled={!taskText.trim()}
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
                project.notes.map((note) => (
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
                        <p className="text-slate-300">{note.content}</p>
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

        {/* Other tabs content can be added here */}
        {activeTab === 'timeline' && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Timeline View</h3>
            <p className="text-slate-400">Timeline visualization coming soon</p>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Team Management</h3>
            <p className="text-slate-400">Team collaboration features coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProjectDetails 