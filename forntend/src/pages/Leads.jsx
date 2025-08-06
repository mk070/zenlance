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
  X,
  FileText,
  Wand2,
  Eye,
  Download,
  CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'
import ProposalModal from '../components/ProposalModal'

const Leads = () => {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('active') // Default to active leads, hiding accepted ones
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Proposal modal state
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [proposals, setProposals] = useState({})
  const [showLeadSelector, setShowLeadSelector] = useState(false)

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
    source: 'Other',
    status: 'New',
    priority: 'Medium',
    projectType: '',
    // Enhanced requirements section
    requirements: {
      scope: ''
    },
    tags: []
  })

  const loadLeads = async (page = 1, search = '', status = '', priority = '') => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 20,
        search,
        ...(priority && priority !== 'all' && { priority }),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      // Handle status filtering
      if (status === 'active') {
        // Show all leads except Won/Accepted ones
        params.excludeStatus = 'Won'
      } else if (status === 'history') {
        // Show only Won/Accepted leads
        params.status = 'Won'
      } else if (status && status !== 'all') {
        // Show specific status
        params.status = status
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

  // Load proposals for a specific lead
  const loadProposals = async (leadId) => {
    try {
      const result = await apiClient.getLeadProposals(leadId)
      if (result.success) {
        setProposals(prev => ({
          ...prev,
          [leadId]: result.data.proposals
        }))
      }
    } catch (error) {
      console.error('Error loading proposals:', error)
    }
  }

  // Handle proposal generation - works exactly like LeadDetails
  const handleGenerateProposal = (lead) => {
    if (!lead) return;
    
    setSelectedLead(lead)
    // Show the modal instead of directly generating
    setShowProposalModal(true);
  }

  // Handle proposal generation completion - works exactly like LeadDetails
  const handleProposalGenerated = async (proposal) => {
    // Add the new proposal to the list
    setProposals(prev => ({
      ...prev,
      [proposal.leadId]: [proposal, ...(prev[proposal.leadId] || [])]
    }))
    
    // Close the modal
    setShowProposalModal(false)
    
    // Reload proposals for this specific lead to ensure we have the latest data
    if (proposal.leadId) {
      await loadProposals(proposal.leadId)
    }
  }

  // Handle proposal modal close - works exactly like LeadDetails
  const handleProposalModalClose = () => {
    setShowProposalModal(false)
    setSelectedLead(null)
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

      // Validate required fields
      if (!formData.firstName?.trim()) {
        toast.error('First name is required')
        return
      }
      if (!formData.lastName?.trim()) {
        toast.error('Last name is required')
        return
      }
      if (!formData.email?.trim()) {
        toast.error('Email is required')
        return
      }
      
      // Build clean lead data
      const leadData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(), 
        email: formData.email.trim(),
        source: formData.source || 'Other',
        status: formData.status || 'New',
        priority: formData.priority || 'Medium'
      }

      // Add optional fields only if they have values
      if (formData.phone?.trim()) leadData.phone = formData.phone.trim()
      if (formData.company?.trim()) leadData.company = formData.company.trim()
      if (formData.jobTitle?.trim()) leadData.jobTitle = formData.jobTitle.trim()
      if (formData.industry?.trim()) leadData.industry = formData.industry.trim()
      if (formData.projectType?.trim()) leadData.projectType = formData.projectType.trim()



      // Add tags if any exist
      if (formData.tags && formData.tags.length > 0) {
        leadData.tags = formData.tags.filter(tag => tag.trim()).map(tag => tag.trim())
      }

      // Add requirements if any content exists
      if (formData.requirements?.scope?.trim()) {
        leadData.requirements = {
          scope: formData.requirements.scope.trim()
        }
      }

      // Debug: Log the data being sent
      console.log('Lead data being sent:', JSON.stringify(leadData, null, 2))

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
          requirements: {
            scope: ''
          },
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
      
      // Handle validation errors specifically
      if (error.data?.validationErrors && Array.isArray(error.data.validationErrors)) {
        const validationMessages = error.data.validationErrors.map(err => 
          `${err.field}: ${err.message}`
        ).join(', ')
        errorMessage = `Validation errors: ${validationMessages}`
      } else if (error.message && error.message !== '[object Object]') {
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

  // Close lead selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLeadSelector && !event.target.closest('.relative')) {
        setShowLeadSelector(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLeadSelector])

  // Load proposals for all leads when leads change
  useEffect(() => {
    leads.forEach(lead => {
      if (!proposals[lead._id]) {
        loadProposals(lead._id)
      }
    })
  }, [leads])

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
          
          <div className="relative">
            <button
              onClick={() => {
                if (leads.length > 0) {
                  setShowLeadSelector(!showLeadSelector)
                } else {
                  toast.error('Please add a lead first before creating a proposal')
                }
              }}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 font-medium"
            >
              <FileText className="w-5 h-5" />
              <span>Create Proposal</span>
              {leads.length > 0 && <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showLeadSelector && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                <div className="p-3 border-b border-white/10">
                  <p className="text-sm text-slate-300 font-medium">Select a lead for proposal</p>
                </div>
                <div className="py-2">
                  {leads.map((lead) => (
                                         <button
                       key={lead._id}
                       onClick={() => {
                         setShowLeadSelector(false)
                         handleGenerateProposal(lead)
                       }}
                       className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center space-x-3"
                     >
                      <div className="w-8 h-8 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-400/20">
                        <span className="text-cyan-400 font-medium text-xs">
                          {lead.firstName?.[0]}{lead.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-slate-400 text-sm truncate">{lead.company}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
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
                <option value="active" className="bg-slate-800">Active Deals</option>
                <option value="history" className="bg-slate-800">📋 Deal History</option>
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
              {searchQuery || statusFilter !== 'active' || priorityFilter !== 'all'
                ? statusFilter === 'history' 
                  ? 'No accepted deals found in history'
                  : 'Try adjusting your search or filters'
                : 'Start building your lead pipeline by adding your first lead'}
            </p>
            {!searchQuery && statusFilter === 'active' && priorityFilter === 'all' && (
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
                <div className="col-span-1">Status</div>
                <div className="col-span-1">Priority</div>
                <div className="col-span-2">Added</div>
                <div className="col-span-1">Actions</div>
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
                  className={`px-6 py-4 hover:bg-white/5 transition-all duration-200 cursor-pointer group ${
                    lead.status === 'Won' && lead.dealAccepted 
                      ? 'bg-green-500/5 border-l-4 border-green-500' 
                      : ''
                  }`}
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
                    <div className="col-span-1">
                      <div className="flex flex-col items-center space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                          {lead.status === 'Won' && lead.dealAccepted ? (
                            <span className="flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Accepted</span>
                            </span>
                          ) : (
                            lead.status.charAt(0).toUpperCase() + lead.status.slice(1)
                          )}
                        </span>
                        {lead.acceptedDate && (
                          <span className="text-xs text-green-400">
                            {new Date(lead.acceptedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
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

                    {/* Actions */}
                    <div className="col-span-1">
                      <div className="flex items-center justify-center space-x-1">
                        {proposals[lead._id] && proposals[lead._id].length > 0 ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const latestProposal = proposals[lead._id][0]
                                const viewUrl = apiClient.viewProposal(latestProposal._id)
                                window.open(viewUrl, '_blank')
                              }}
                              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all duration-200 group"
                              title="View Proposal"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  const latestProposal = proposals[lead._id][0]
                                  const blob = await apiClient.downloadProposal(latestProposal._id)
                                  const url = window.URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `proposal-${latestProposal.proposalNumber}.pdf`
                                  document.body.appendChild(a)
                                  a.click()
                                  window.URL.revokeObjectURL(url)
                                  document.body.removeChild(a)
                                  toast.success('Proposal downloaded!')
                                } catch (error) {
                                  toast.error('Failed to download proposal')
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all duration-200"
                              title="Download Proposal"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGenerateProposal(lead)
                            }}
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all duration-200 group"
                            title="Generate Proposal"
                          >
                            <Wand2 className="w-4 h-4" />
                          </button>
                        )}
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
                      placeholder="Phone number (minimum 3 characters)"
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
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                      placeholder="e.g. Technology, Healthcare, Finance"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Project Type</label>
                    <input
                      type="text"
                      value={formData.projectType}
                      onChange={(e) => handleInputChange('projectType', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                      placeholder="e.g. Website, Mobile App, Software"
                    />
                  </div>
                </div>
              </div>

              {/* Project Requirements (Optional) */}
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Project Requirements</h4>
                <p className="text-sm text-slate-400 mb-4">Describe your project requirements, scope, deliverables, and any technical or business needs</p>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Requirements</label>
                  <textarea
                    value={formData.requirements.scope}
                    onChange={(e) => handleInputChange('requirements.scope', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all resize-none"
                    placeholder="Describe your project requirements including scope, deliverables, technical needs, business goals, timeline expectations, and any other important details..."
                    rows={5}
                  />
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

      {/* Proposal Modal */}
      <ProposalModal
        isOpen={showProposalModal}
        onClose={handleProposalModalClose}
        lead={selectedLead}
        onProposalGenerated={handleProposalGenerated}
      />
    </div>
  )
}

export default Leads 