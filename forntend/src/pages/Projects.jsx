import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  Calendar,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Users,
  Target,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const Projects = () => {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1) 
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 12

  // Form data for creating projects
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientId: '',
    status: 'planning',
    priority: 'medium',
    startDate: '',
    endDate: '',
    budget: '',
    teamMembers: [],
    tags: [],
    notes: ''
  })

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ]

  const loadProjects = async (page = 1, search = '', status = '', priority = '') => {
    try {
      if (page === 1) setInitialLoading(true)
      else setLoading(true)

      const params = {
        page,
        limit: itemsPerPage,
        ...(search && { search }),
        ...(status && { status }),
        ...(priority && { priority })
      }

      const result = await apiClient.getProjects(params)
      
      if (result.success) {
        setProjects(result.data || [])
        setFilteredProjects(result.data || [])
        setTotalPages(result.pagination?.pages || 1)
        setTotalItems(result.pagination?.total || 0)
        setCurrentPage(page)
      } else {
        toast.error('Failed to load projects')
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  const handleSearch = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    
    // Reset to first page when searching
    setCurrentPage(1)
    loadProjects(1, query, statusFilter, priorityFilter)
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setCurrentPage(1)
    loadProjects(1, searchQuery, status, priorityFilter)
  }

  const handlePriorityFilter = (priority) => {
    setPriorityFilter(priority)
    setCurrentPage(1)
    loadProjects(1, searchQuery, statusFilter, priority)
  }

  const handlePageChange = (newPage) => {
    loadProjects(newPage, searchQuery, statusFilter, priorityFilter)
  }

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleTagsChange = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag)
    setFormData(prev => ({
      ...prev,
      tags
    }))
  }

  const handleSaveProject = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Project name is required')
      return
    }
    
    setSaving(true)
    
    try {
      const projectData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : undefined
      }

      const result = await apiClient.createProject(projectData)
      
      if (result.success) {
        toast.success('Project created successfully!')
        setShowCreateForm(false)
        setFormData({
          name: '',
          description: '',
          clientId: '',
          status: 'planning',
          priority: 'medium',
          startDate: '',
          endDate: '',
          budget: '',
          teamMembers: [],
          tags: [],
          notes: ''
        })
        loadProjects()
      } else {
        toast.error(result.error || 'Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      
      // Show user-friendly error message
      let errorMessage = 'Failed to create project'
      if (error.message && error.message !== '[object Object]') {
        errorMessage = error.message
      } else if (error.data?.error) {
        errorMessage = error.data.error
      } else if (error.data?.message) {
        errorMessage = error.data.message
      }
      
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) {
      return
    }

    try {
      const result = await apiClient.deleteProject(projectId)
      if (result.success) {
        toast.success('Project deleted successfully!')
        loadProjects()
      } else {
        toast.error('Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  const handleUpdateStatus = async (projectId, newStatus) => {
    try {
      const result = await apiClient.updateProjectStatus(projectId, newStatus)
      if (result.success) {
        toast.success('Project status updated!')
        loadProjects()
      } else {
        toast.error('Failed to update project status')
      }
    } catch (error) {
      console.error('Error updating project status:', error)
      toast.error('Failed to update project status')
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'active':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'on_hold':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 'completed':
        return 'text-green-400 bg-green-400/10 border-green-400/20'
      case 'cancelled':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <PlayCircle className="w-4 h-4" />
      case 'on_hold':
        return <PauseCircle className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'text-gray-400'
      case 'medium':
        return 'text-yellow-400'
      case 'high':
        return 'text-orange-400'
      case 'urgent':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const calculateProgress = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0
    const completedTasks = project.tasks.filter(task => task.status === 'completed').length
    return Math.round((completedTasks / project.tasks.length) * 100)
  }

  if (initialLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Projects</h1>
          <p className="text-slate-400">Manage and track your client projects</p>
        </div>
        <motion.button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </motion.button>
      </div>

      {/* Filters and Search */}
      <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search projects by name, description, or client..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-200"
            >
              <Filter className="w-5 h-5" />
              <span>{statusFilter ? statusOptions.find(opt => opt.value === statusFilter)?.label : 'All Statuses'}</span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showFilters && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl py-2 z-20">
                <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide">Status</div>
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handleStatusFilter(option.value)
                      setShowFilters(false)
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
                <div className="px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide border-t border-white/10 mt-2">Priority</div>
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      handlePriorityFilter(option.value)
                      setShowFilters(false)
                    }}
                    className="w-full text-left px-4 py-2 text-white hover:bg-white/10 transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={() => loadProjects(currentPage, searchQuery, statusFilter, priorityFilter)}
            disabled={loading}
            className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {filteredProjects.map((project) => (
          <motion.div
            key={project._id}
            className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300"
            whileHover={{ y: -2 }}
          >
            {/* Project Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-1">{project.name}</h3>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full border text-xs font-medium ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    <span className="capitalize">{project.status.replace('_', ' ')}</span>
                  </div>
                  <div className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority?.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Info */}
            {project.clientName && (
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">{project.clientName}</span>
              </div>
            )}

            {/* Description */}
            {project.description && (
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>
            )}

            {/* Progress Bar */}
            {project.tasks && project.tasks.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Progress</span>
                  <span className="text-xs text-slate-300">{calculateProgress(project)}%</span>
                </div>
                <div className="w-full bg-slate-800/50 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress(project)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Project Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Budget */}
              {project.budget && (
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400">
                    ${project.budget.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Team Size */}
              {project.teamMembers && project.teamMembers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">
                    {project.teamMembers.length} members
                  </span>
                </div>
              )}

              {/* Start Date */}
              {project.startDate && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">
                    {new Date(project.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Tasks Count */}
              {project.tasks && (
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">
                    {project.tasks.length} tasks
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-slate-300"
                  >
                    {tag}
                  </span>
                ))}
                {project.tags.length > 3 && (
                  <span className="px-2 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-slate-400">
                    +{project.tags.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                onClick={() => navigate(`/projects/${project._id}`)}
                className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm">View</span>
              </button>

              <div className="flex items-center space-x-2">
                {/* Quick Status Toggle */}
                {project.status === 'active' ? (
                  <button
                    onClick={() => handleUpdateStatus(project._id, 'on_hold')}
                    className="p-2 text-slate-400 hover:text-orange-400 hover:bg-orange-400/10 rounded-lg transition-all duration-200"
                    title="Pause Project"
                  >
                    <PauseCircle className="w-4 h-4" />
                  </button>
                ) : project.status === 'on_hold' ? (
                  <button
                    onClick={() => handleUpdateStatus(project._id, 'active')}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all duration-200"
                    title="Resume Project"
                  >
                    <PlayCircle className="w-4 h-4" />
                  </button>
                ) : null}

                <button
                  onClick={() => navigate(`/projects/${project._id}/edit`)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteProject(project._id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && !loading && (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No projects found</h3>
          <p className="text-slate-400 mb-6">
            {searchQuery || statusFilter || priorityFilter 
              ? "Try adjusting your search or filters" 
              : "Create your first project to get started"}
          </p>
          {!searchQuery && !statusFilter && !priorityFilter && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
            >
              Create Project
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="text-sm text-slate-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} projects
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-white px-4 py-2">
              {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-light text-white">Create New Project</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                    placeholder="Enter project name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client</label>
                  <input
                    type="text"
                    value={formData.clientId}
                    onChange={(e) => handleInputChange('clientId', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                    placeholder="Client name"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all resize-none"
                  placeholder="Project description"
                />
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                  >
                    {statusOptions.slice(1).map((option) => (
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
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                  >
                    {priorityOptions.slice(1).map((option) => (
                      <option key={option.value} value={option.value} className="bg-slate-800">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates and Budget */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Budget</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tags</label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleTagsChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                  placeholder="Enter tags separated by commas"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all resize-none"
                  placeholder="Additional notes"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 border border-white/20 text-white rounded-xl hover:bg-white/5 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FolderOpen className="w-5 h-5" />
                  )}
                  <span>{saving ? 'Creating...' : 'Create Project'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Projects 