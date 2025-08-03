import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  Mail, 
  Phone, 
  Building2, 
  MapPin,
  Calendar,
  Star,
  RefreshCw,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const Leads = () => {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Form state for creating new lead
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    industry: '',
    website: '',
    source: '',
    status: 'new',
    priority: 'medium',
    projectType: '',
    budget: {
      min: '',
      max: '',
      currency: 'USD'
    },
    timeline: {
      startDate: '',
      endDate: '',
      urgency: 'flexible'
    },
    description: '',
    tags: []
  })

  const loadLeads = async (page = 1, search = '', status = '', priority = '') => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 20,
        search,
        ...(status && status !== 'all' && { status }),
        ...(priority && priority !== 'all' && { priority }),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      const result = await apiClient.getLeads(params)
      
      if (result.success) {
        setLeads(result.data.leads)
        setFilteredLeads(result.data.leads)
        setPagination(result.data.pagination)
      } else {
        toast.error(result.error || 'Failed to load leads')
      }
    } catch (error) {
      console.error('Error loading leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  const refreshLeads = async () => {
    setRefreshing(true)
    await loadLeads(pagination.page, searchQuery, statusFilter, priorityFilter)
    setRefreshing(false)
    toast.success('Leads refreshed')
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    loadLeads(1, query, statusFilter, priorityFilter)
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    loadLeads(1, searchQuery, status, priorityFilter)
  }

  const handlePriorityFilter = (priority) => {
    setPriorityFilter(priority)
    loadLeads(1, searchQuery, statusFilter, priority)
  }

  const handleViewLead = (lead) => {
    navigate(`/leads/${lead._id}`)
  }

  const handlePageChange = (newPage) => {
    loadLeads(newPage, searchQuery, statusFilter, priorityFilter)
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

  const handleSaveLead = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      
      const leadData = {
        ...formData,
        budget: {
          ...formData.budget,
          min: formData.budget.min ? parseFloat(formData.budget.min) : undefined,
          max: formData.budget.max ? parseFloat(formData.budget.max) : undefined
        }
      }

      // Ensure required fields have default values
      if (!leadData.source || leadData.source === '') {
        leadData.source = 'Other'
      }
      if (!leadData.status || leadData.status === '') {
        leadData.status = 'New'
      }
      if (!leadData.priority || leadData.priority === '') {
        leadData.priority = 'Medium'
      }

      // Remove empty fields (except required ones)
      Object.keys(leadData).forEach(key => {
        if (leadData[key] === '' && !['source', 'status', 'priority'].includes(key)) {
          delete leadData[key]
        }
      })

      const result = await apiClient.createLead(leadData)

      if (result.success) {
        toast.success('Lead created successfully!')
        setShowCreateForm(false)
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          jobTitle: '',
          industry: '',
          website: '',
          source: 'Other',
          status: 'New',
          priority: 'Medium',
          projectType: '',
          budget: {
            min: '',
            max: '',
            currency: 'USD'
          },
          timeline: {
            startDate: '',
            endDate: '',
            urgency: 'flexible'
          },
          description: '',
          tags: []
        })
        loadLeads()
      } else {
        toast.error(result.error || 'Failed to create lead')
      }
    } catch (error) {
      console.error('Error creating lead:', error)
      
      // Show user-friendly error message
      let errorMessage = 'Failed to create lead'
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

  useEffect(() => {
    loadLeads()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'contacted':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'qualified':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'proposal':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 'negotiation':
        return 'text-pink-400 bg-pink-400/10 border-pink-400/20'
      case 'won':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'lost':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'text-gray-400'
      case 'medium':
        return 'text-yellow-400'
      case 'high':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <Star className="w-4 h-4 text-red-400 fill-current" />
      case 'medium':
        return <Star className="w-4 h-4 text-yellow-400" />
      default:
        return <Star className="w-4 h-4 text-gray-400" />
    }
  }

  if (initialLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-light text-white mb-2 flex items-center space-x-3">
            <Users className="w-8 h-8 text-cyan-400" />
            <span>Leads</span>
          </h1>
          <p className="text-slate-400 font-light">
            Manage your potential clients and track your sales pipeline
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={refreshLeads}
            disabled={refreshing}
            className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add Lead</span>
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="appearance-none bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
              >
                <option value="all" className="bg-slate-800">All Status</option>
                <option value="new" className="bg-slate-800">New</option>
                <option value="contacted" className="bg-slate-800">Contacted</option>
                <option value="qualified" className="bg-slate-800">Qualified</option>
                <option value="proposal" className="bg-slate-800">Proposal</option>
                <option value="negotiation" className="bg-slate-800">Negotiation</option>
                <option value="won" className="bg-slate-800">Won</option>
                <option value="lost" className="bg-slate-800">Lost</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => handlePriorityFilter(e.target.value)}
                className="appearance-none bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
              >
                <option value="all" className="bg-slate-800">All Priority</option>
                <option value="high" className="bg-slate-800">High</option>
                <option value="medium" className="bg-slate-800">Medium</option>
                <option value="low" className="bg-slate-800">Low</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Leads Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-6"
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No leads found</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start building your lead pipeline by adding your first lead'}
            </p>
            {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-medium"
              >
                Add Your First Lead
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-400">
                <div className="col-span-3">Lead</div>
                <div className="col-span-2">Company</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Priority</div>
                <div className="col-span-2">Added</div>
              </div>
            </div>

            {/* Leads */}
            <div className="divide-y divide-white/10">
              {filteredLeads.map((lead, index) => (
                <motion.div
                  key={lead._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                  onClick={() => handleViewLead(lead)}
                  className="px-6 py-4 hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Lead Info */}
                    <div className="col-span-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-400/20">
                          <span className="text-cyan-400 font-medium text-sm">
                            {lead.firstName?.[0]}{lead.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-cyan-300 transition-colors">
                            {lead.fullName || `${lead.firstName} ${lead.lastName}`}
                          </p>
                          <p className="text-sm text-slate-400">{lead.jobTitle}</p>
                        </div>
                      </div>
                    </div>

                    {/* Company */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 truncate">{lead.company}</span>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-300 truncate">{lead.email}</span>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-400">{lead.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </div>

                    {/* Priority */}
                    <div className="col-span-1">
                      <div className="flex items-center justify-center">
                        {getPriorityIcon(lead.priority)}
                      </div>
                    </div>

                    {/* Added Date */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} leads
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-300 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Create Lead Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-white">Add New Lead</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h4 className="text-lg font-medium text-white mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                      placeholder="Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h4 className="text-lg font-medium text-white mb-4">Company Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company *</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                      placeholder="Company Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Job Title</label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                      placeholder="CEO, CTO, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.firstName || !formData.lastName || !formData.email || !formData.company}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                  <span>{saving ? 'Creating...' : 'Create Lead'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Leads 