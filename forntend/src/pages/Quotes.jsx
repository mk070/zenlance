import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  DollarSign, 
  Calendar,
  Eye,
  Edit3,
  Copy,
  Send,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'
import AIButton from '../components/ai/AIButton'
import AIProposalGenerator from '../components/ai/AIProposalGenerator'

const Quotes = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [quotes, setQuotes] = useState([])
  const [filteredQuotes, setFilteredQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1) 
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const itemsPerPage = 10

  // AI Features
  const [showAIProposalGenerator, setShowAIProposalGenerator] = useState(false)
  const [selectedLeadForAI, setSelectedLeadForAI] = useState(null)

  // Project conversion data
  const [projectData, setProjectData] = useState(null)
  const [clientData, setClientData] = useState(null)
  const [leadData, setLeadData] = useState(null)

  // Additional state for clients and projects
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  
  // Quote confirmation modal state
  const [showQuoteConfirmation, setShowQuoteConfirmation] = useState(false)
  const [pendingQuoteData, setPendingQuoteData] = useState(null)

  // Form data for creating quotes
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    clientName: '',
    clientEmail: '',
    description: '',
    items: [{
      itemType: 'service',
      name: '',
      description: '',
      quantity: 1,
      unit: 'piece',
      rate: 0,
      amount: 0
    }],
    subtotal: 0,
    tax: 0,
    taxAmount: 0,
    discount: 0,
    discountAmount: 0,
    total: 0,
    currency: 'USD',
    validUntil: '',
    notes: '',
    terms: '',
    projectId: '' // For project quotes - REQUIRED
  })

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' }
  ]

  const loadQuotes = async (page = 1, search = '', status = '') => {
    try {
      if (page === 1) setInitialLoading(true)
      else setLoading(true)

      const params = {
        page,
        limit: itemsPerPage,
        ...(search && { search }),
        ...(status && { status })
      }

      const result = await apiClient.getQuotes(params)
      
      if (result.success) {
        setQuotes(result.data || [])
        setFilteredQuotes(result.data || [])
        setTotalPages(result.pagination?.pages || 1)
        setTotalItems(result.pagination?.total || 0)
        setCurrentPage(page)
      } else {
        toast.error('Failed to load quotes')
      }
    } catch (error) {
      console.error('Error loading quotes:', error)
      toast.error('Failed to load quotes')
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
    loadQuotes(1, query, statusFilter)
  }

  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setCurrentPage(1)
    loadQuotes(1, searchQuery, status)
  }

  const handlePageChange = (newPage) => {
    loadQuotes(newPage, searchQuery, statusFilter)
  }

  const loadClients = async () => {
    try {
      setLoadingClients(true)
      const result = await apiClient.getClients()
      if (result.success) {
        setClients(result.data.clients || [])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoadingClients(false)
    }
  }

  const loadProjects = async () => {
    try {
      setLoadingProjects(true)
      const result = await apiClient.getProjects()
      
      if (result.success) {
        // Fix: Projects are in result.data directly, not result.data.projects
        const projectsData = Array.isArray(result.data) ? result.data : (result.data.projects || [])
        setProjects(projectsData)
        console.log(`Loaded ${projectsData.length} projects:`, projectsData)
        
        // If a client is already selected, filter projects for that client
        if (formData.clientId) {
          const clientProjects = projectsData.filter(project => {
            if (typeof project.clientId === 'string') {
              return project.clientId === formData.clientId
            } else if (typeof project.clientId === 'object' && project.clientId?._id) {
              return project.clientId._id === formData.clientId
            }
            return false
          })
          setFilteredProjects(clientProjects)
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  const loadProjectsForClient = async (clientId, clientEmail = null) => {
    try {
      setLoadingProjects(true)
      console.log('Loading projects for client ID:', clientId, 'Email:', clientEmail)
      
      // First try with client ID
      let result = await apiClient.getProjects({ client: clientId })
      let projectsData = result.success ? (Array.isArray(result.data) ? result.data : (result.data.projects || [])) : []
      
      console.log(`Found ${projectsData.length} projects using client ID`)
      
      // If no projects found with ID and we have email, try searching by email
      if (projectsData.length === 0 && clientEmail) {
        console.log('No projects found with client ID, trying with email:', clientEmail)
        
        // Load all projects and filter by client email
        const allProjectsResult = await apiClient.getProjects()
        if (allProjectsResult.success) {
          const allProjects = Array.isArray(allProjectsResult.data) ? allProjectsResult.data : (allProjectsResult.data.projects || [])
          console.log('Total projects loaded:', allProjects.length)
          
          // Filter projects that belong to this client (by email or ID)
          projectsData = allProjects.filter(project => {
            const projectClient = project.clientId
            
            // Check if clientId is populated with client data
            if (typeof projectClient === 'object' && projectClient) {
              const match = projectClient.email === clientEmail || projectClient._id === clientId
              if (match) {
                console.log('Found matching project:', project.name, 'Client email:', projectClient.email)
              }
              return match
            }
            
            // Check if clientId is just a string ID
            if (typeof projectClient === 'string') {
              const match = projectClient === clientId
              if (match) {
                console.log('Found matching project by ID:', project.name)
              }
              return match
            }
            
            return false
          })
          
          console.log(`Filtered ${projectsData.length} projects by email/ID`)
        }
      }
      
      console.log(`Final result: ${projectsData.length} projects for client`, projectsData)
      
      // Update both all projects and filtered projects
      setProjects(projectsData.length > 0 ? projectsData : projects) // Keep existing if none found
      setFilteredProjects(projectsData)
      
      if (projectsData.length === 0) {
        console.log('No projects found for this client')
        toast(`No projects found for client ${clientEmail || clientId}`, { icon: 'ℹ️' })
      }
      
    } catch (error) {
      console.error('Error loading projects for client:', error)
      toast.error('Failed to load projects for client')
      setFilteredProjects([])
    } finally {
      setLoadingProjects(false)
    }
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
      
      // Auto-populate client details when clientId changes
      if (field === 'clientId' && value) {
        const selectedClient = clients.find(client => client._id === value)
        if (selectedClient) {
          const clientEmail = selectedClient.email || selectedClient.contactEmail
          
          setFormData(prev => ({
            ...prev,
            clientName: selectedClient.name || `${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim() || 'Unknown Client',
            clientEmail: clientEmail || 'unknown@email.com',
            projectId: '' // Reset project selection when client changes
          }))
          
          // Load projects specifically for this client using their ID and email
          console.log('Loading projects for client:', selectedClient.firstName, selectedClient.lastName, 'ID:', value, 'Email:', clientEmail)
          loadProjectsForClient(value, clientEmail)
        }
      } else if (field === 'clientId' && !value) {
        // Clear filtered projects when no client is selected
        setFilteredProjects([])
        setFormData(prev => ({
          ...prev,
          projectId: ''
        }))
      }

      // Auto-populate project details when projectId changes
      if (field === 'projectId' && value) {
        const selectedProject = projects.find(project => project._id === value)
        if (selectedProject) {
          setFormData(prev => ({
            ...prev,
            title: `Quote for ${selectedProject.name}`,
            description: selectedProject.description || `Quote for project: ${selectedProject.name}`,
            items: [{
              itemType: 'service',
              name: selectedProject.name || 'Project Services',
              description: selectedProject.description || `Services for project: ${selectedProject.name}`,
              quantity: 1,
              unit: 'project',
              rate: selectedProject.budget || 0,
              amount: selectedProject.budget || 0
            }],
            subtotal: selectedProject.budget || 0,
            total: selectedProject.budget || 0
          }))
        }
      }
      
      // Convert validUntil string to Date object
      if (field === 'validUntil' && value && typeof value === 'string') {
        value = new Date(value)
      }
    }
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Recalculate amount for this item
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].rate || 0)
    }
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }))
    
    // Recalculate totals
    const subtotal = newItems.reduce((sum, item) => sum + (item.amount || 0), 0)
    setFormData(prev => ({
      ...prev,
      subtotal,
      total: subtotal + (prev.tax || 0)
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0
      }]
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index)
      setFormData(prev => ({
        ...prev,
        items: newItems
      }))
      
      // Recalculate totals
      const subtotal = newItems.reduce((sum, item) => sum + (item.amount || 0), 0)
      setFormData(prev => ({
        ...prev,
        subtotal,
        total: subtotal + (prev.tax || 0)
      }))
    }
  }

  const handleSaveQuote = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    
    if (!formData.clientId) {
      toast.error('Client is required')
      return
    }
    
    if (!formData.projectId || !formData.projectId.trim()) {
      toast.error('Project selection is required')
      return
    }
    
    if (!formData.validUntil) {
      toast.error('Valid until date is required')
      return
    }
    
    // Prepare data for API - convert validUntil to Date if it's a string
    const apiData = {
      ...formData,
      validUntil: typeof formData.validUntil === 'string' ? new Date(formData.validUntil) : formData.validUntil,
      // Generate a temporary quote number if not present (backend should override this)
      quoteNumber: formData.quoteNumber || `QT-${Date.now()}`
    }
    
    // Show confirmation modal instead of directly creating
    setPendingQuoteData(apiData)
    setShowQuoteConfirmation(true)
  }

  const handleConfirmQuoteCreation = async () => {
    if (!pendingQuoteData) return
    
    setSaving(true)
    
    try {
      console.log('Creating quote with confirmed data:', JSON.stringify(pendingQuoteData, null, 2))
      const result = await apiClient.createQuote(pendingQuoteData)
      
      if (result.success) {
        toast.success('Quote created successfully!')
        setShowCreateForm(false)
        setFormData({
          title: '',
          clientId: '',
          clientName: '',
          clientEmail: '',
          description: '',
          items: [{
            itemType: 'service',
            name: '',
            description: '',
            quantity: 1,
            unit: 'piece',
            rate: 0,
            amount: 0
          }],
          subtotal: 0,
          tax: 0,
          taxAmount: 0,
          discount: 0,
          discountAmount: 0,
          total: 0,
          currency: 'USD',
          validUntil: '',
          notes: '',
          terms: '',
          projectId: '' // REQUIRED FIELD
        })
        loadQuotes()
        
        // Close confirmation modal and reset
        setShowQuoteConfirmation(false)
        setPendingQuoteData(null)
      } else {
        toast.error(result.error || 'Failed to create quote')
      }
    } catch (error) {
      console.error('Error creating quote:', error)
      
      // Show user-friendly error message
      let errorMessage = 'Failed to create quote'
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

  const handleCancelQuoteCreation = () => {
    setShowQuoteConfirmation(false)
    setPendingQuoteData(null)
    setSaving(false)
  }

  const handleDuplicateQuote = async (quoteId) => {
    try {
      const result = await apiClient.duplicateQuote(quoteId)
      if (result.success) {
        toast.success('Quote duplicated successfully!')
        loadQuotes()
      } else {
        toast.error('Failed to duplicate quote')
      }
    } catch (error) {
      console.error('Error duplicating quote:', error)
      toast.error('Failed to duplicate quote')
    }
  }

  const handleOpenAIProposalGenerator = () => {
    if (selectedLeadForAI) {
      setShowAIProposalGenerator(true)
    } else {
      toast.error('No lead data available for AI generation')
    }
  }

  const handleAIProposalGenerated = (proposal) => {
    // Add the AI-generated proposal to the form description
    setFormData(prev => ({
      ...prev,
      description: proposal
    }))
    
    setShowAIProposalGenerator(false)
    toast.success('AI proposal added to quote form!')
  }

  const handleSendQuote = async (quoteId) => {
    try {
      const result = await apiClient.sendQuote(quoteId)
      if (result.success) {
        toast.success('Quote sent successfully!')
        loadQuotes()
      } else {
        toast.error('Failed to send quote')
      }
    } catch (error) {
      console.error('Error sending quote:', error)
      toast.error('Failed to send quote')
    }
  }

  const handleDeleteQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) {
      return
    }

    try {
      const result = await apiClient.deleteQuote(quoteId)
      if (result.success) {
        toast.success('Quote deleted successfully!')
        loadQuotes()
      } else {
        toast.error('Failed to delete quote')
      }
    } catch (error) {
      console.error('Error deleting quote:', error)
      toast.error('Failed to delete quote')
    }
  }

  const handleProjectConversion = async (projectId, clientId, leadId) => {
    try {
      console.log('Loading data for:', { projectId, clientId, leadId })
      
      // First load the project to get the client ID if not provided
      const projectResult = await apiClient.getProject(projectId)
      
      if (!projectResult.success) {
        throw new Error('Failed to load project')
      }

      const project = projectResult.data
      console.log('Loaded project data:', project)
      
      // Use provided clientId or extract from project
      let actualClientId = clientId
      if (!clientId || typeof clientId !== 'string' || clientId === '[object Object]') {
        if (project.clientId) {
          if (typeof project.clientId === 'object' && project.clientId._id) {
            actualClientId = project.clientId._id
          } else if (typeof project.clientId === 'string') {
            actualClientId = project.clientId
          }
        }
      }

      if (!actualClientId) {
        console.error('No valid clientId found in project or URL')
        toast.error('No client associated with this project.')
        setShowCreateForm(true)
        return
      }

      console.log('Using clientId:', actualClientId)
      
      // Load client and lead data
      const [clientResult, leadResult] = await Promise.all([
        apiClient.getClient(actualClientId),
        leadId ? apiClient.getLead(leadId) : Promise.resolve(null)
      ])

      if (clientResult.success) {
        const client = clientResult.data.client || clientResult.data
        const lead = leadResult?.success ? leadResult.data.lead : null

        setProjectData(project)
        setClientData(client)
        setLeadData(lead)

        // Always show form with pre-filled data for user confirmation
        await prefillQuoteFromProject(project, client, lead)

      } else {
        toast.error('Failed to load project or client data')
        setShowCreateForm(true) // Fallback to empty form
      }
    } catch (error) {
      console.error('Error loading project conversion data:', error)
      toast.error('Failed to load project data. You can create a quote manually.')
      setShowCreateForm(true) // Fallback to empty form
    }
  }



  const prefillQuoteFromProject = async (project, client, lead) => {
    // Pre-fill form with project and client data
    setFormData({
      title: `Quote for ${project.name}`,
      clientId: client._id,
      clientName: client.name || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown Client',
      clientEmail: client.email || client.contactEmail || 'unknown@email.com',
      description: project.description || `Quote for project: ${project.name}`,
      items: [{
        itemType: 'service',
        name: project.name || 'Project Services',
        description: project.description || `Services for project: ${project.name}`,
        quantity: 1,
        unit: 'project',
        rate: project.budget || 0,
        amount: project.budget || 0
      }],
      subtotal: project.budget || 0,
      tax: 0,
      taxAmount: 0,
      discount: 0,
      discountAmount: 0,
      total: project.budget || 0,
            currency: project.currency || 'USD',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      notes: `Quote for project: ${project.name}${lead ? ` (Converted from lead)` : ''}`,
      terms: '',
      projectId: project._id
    })

    setShowCreateForm(true)
    
    toast.success('Project loaded! Please review and complete the quote details.', {
      duration: 4000
    })
  }

  // Effect to filter projects when clientId changes in formData
  useEffect(() => {
    if (formData.clientId && projects.length > 0) {
      const clientProjects = projects.filter(project => {
        if (typeof project.clientId === 'string') {
          return project.clientId === formData.clientId
        } else if (typeof project.clientId === 'object' && project.clientId?._id) {
          return project.clientId._id === formData.clientId
        }
        return false
      })
      setFilteredProjects(clientProjects)
      console.log(`Filtered ${clientProjects.length} projects for client ${formData.clientId}`)
      
      // Verify that the selected project exists in the filtered list
      if (formData.projectId) {
        const projectExists = clientProjects.find(p => p._id === formData.projectId)
        if (projectExists) {
          console.log('Selected project found in filtered list:', projectExists.name)
        } else {
          console.warn('Selected project not found in filtered list:', formData.projectId)
        }
      }
    } else if (!formData.clientId) {
      setFilteredProjects([])
    }
  }, [formData.clientId, formData.projectId, projects])

  useEffect(() => {
    loadQuotes()
    loadClients()
    loadProjects()
    
    // Handle URL parameters from lead conversion or project creation
    const urlParams = new URLSearchParams(location.search)
    const clientId = urlParams.get('client')
    const projectId = urlParams.get('project')
    const source = urlParams.get('source')
    const leadId = urlParams.get('leadId')
    
    if (source === 'lead' && clientId) {
      // Pre-fill form with client and show create form (legacy lead conversion)
      setFormData(prev => ({
        ...prev,
        clientId: clientId
      }))
      setShowCreateForm(true)
      
      // Show a helpful message and option to use AI
      if (leadId) {
        toast.success('Ready to create proposal for this lead!', {
          duration: 4000
        })
        
        // Set the lead data for AI generator
        setSelectedLeadForAI({
          id: leadId,
          clientId: clientId
        })
      }
    } else if (source === 'project' && projectId) {
      // Handle project conversion - load project and client data
      console.log('Project conversion params:', { projectId, clientId, leadId })
      handleProjectConversion(projectId, clientId, leadId)
    }
  }, [location.search])

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20'
      case 'sent':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'accepted':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'declined':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'expired':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />
      case 'expired':
        return <AlertCircle className="w-4 h-4" />
      case 'sent':
        return <Send className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (initialLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading quotes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-white mb-2">Quotes</h1>
          <p className="text-slate-400">Manage your project quotes and proposals</p>
        </div>
        <motion.button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          <span>New Quote</span>
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
              placeholder="Search quotes by title, client, or quote number..."
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
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={() => loadQuotes(currentPage, searchQuery, statusFilter)}
            disabled={loading}
            className="flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quotes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {filteredQuotes.map((quote) => (
          <motion.div
            key={quote._id}
            className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300"
            whileHover={{ y: -2 }}
          >
            {/* Quote Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-1">{quote.title}</h3>
                <p className="text-sm text-slate-400">#{quote.quoteNumber}</p>
              </div>
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(quote.status)}`}>
                {getStatusIcon(quote.status)}
                <span className="capitalize">{quote.status}</span>
              </div>
            </div>

            {/* Client Info */}
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">{quote.clientName}</span>
            </div>

            {/* Amount */}
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-lg font-semibold text-emerald-400">
                ${quote.total?.toLocaleString() || '0.00'}
              </span>
            </div>

            {/* Valid Until */}
            {quote.validUntil && (
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">
                  Valid until {new Date(quote.validUntil).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                onClick={() => navigate(`/quotes/${quote._id}`)}
                className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm">View</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDuplicateQuote(quote._id)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>

                {quote.status === 'draft' && (
                  <button
                    onClick={() => handleSendQuote(quote._id)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                    title="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => navigate(`/quotes/${quote._id}/edit`)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteQuote(quote._id)}
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
      {filteredQuotes.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No quotes found</h3>
          <p className="text-slate-400 mb-6">
            {searchQuery || statusFilter 
              ? "Try adjusting your search or filters" 
              : "Create your first quote to get started"}
          </p>
          {!searchQuery && !statusFilter && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200"
            >
              Create Quote
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="text-sm text-slate-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} quotes
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

      {/* Create Quote Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-2xl font-light text-white">Create New Quote</h2>
                {selectedLeadForAI && (
                  <AIButton
                    onClick={handleOpenAIProposalGenerator}
                    size="sm"
                    variant="primary"
                  >
                    AI Generate Proposal
                  </AIButton>
                )}
              </div>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setProjectData(null)
                  setClientData(null)
                  setLeadData(null)
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-6">
              {/* Project Information (if applicable) */}
              {projectData && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                  <h3 className="text-lg font-medium text-blue-400 mb-2">Project Quote</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-300 text-sm">
                        <span className="font-medium">Project:</span> {projectData.name}
                      </p>
                      {projectData.description && (
                        <p className="text-slate-400 text-xs mt-1">{projectData.description}</p>
                      )}
                    </div>
                    <div>
                      {clientData && (
                        <p className="text-slate-300 text-sm">
                          <span className="font-medium">Client:</span> {clientData.firstName} {clientData.lastName}
                        </p>
                      )}
                      {projectData.budget && (
                        <p className="text-slate-300 text-sm">
                          <span className="font-medium">Budget:</span> ${projectData.budget.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                    placeholder="Quote title"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-300">Client *</label>
                    <button
                      type="button"
                      onClick={loadClients}
                      disabled={loadingClients}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleInputChange('clientId', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                    required
                    disabled={loadingClients}
                  >
                    <option value="">
                      {loadingClients ? 'Loading clients...' : 'Select a client'}
                    </option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id} className="bg-slate-800 text-white">
                        {client.firstName} {client.lastName} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client Name *</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                    placeholder="Client name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client Email *</label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                    placeholder="client@email.com"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all resize-none"
                    placeholder="Quote description"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-300">
                      Project <span className="text-red-400">*</span>
                      <span className="text-xs text-slate-400 ml-2">(Required)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.clientId) {
                          loadProjectsForClient(formData.clientId, formData.clientEmail)
                        } else {
                          loadProjects()
                        }
                      }}
                      disabled={loadingProjects}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      🔄 Refresh
                    </button>
                  </div>
                  <select
                    value={formData.projectId || ''}
                    onChange={(e) => handleInputChange('projectId', e.target.value)}
                    className={`w-full px-4 py-3 bg-white/5 backdrop-blur-sm border rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                      !formData.projectId ? 'border-red-400/50 focus:ring-red-400/50 focus:border-red-400/50' : 'border-white/10 focus:ring-cyan-400/50 focus:border-cyan-400/50'
                    }`}
                    disabled={loadingProjects || !formData.clientId}
                    required
                  >
                                          <option value="">
                        {loadingProjects ? 'Loading projects...' : 
                         !formData.clientId ? 'Select a client first' :
                         filteredProjects.length === 0 ? 'No projects found for this client' :
                         'Select a project (required)'}
                      </option>
                                          {filteredProjects.map(project => (
                        <option key={project._id} value={project._id} className="bg-slate-800 text-white">
                          {project.name} - ${project.budget?.toLocaleString() || 'No budget'}
                        </option>
                      ))}
                    </select>

                  </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium text-slate-300">Items</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="col-span-5">
                        <label className="block text-xs font-medium text-slate-400 mb-2">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 text-sm"
                          placeholder="Item description"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-2">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-2">Rate</label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-2">Amount</label>
                        <div className="px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-slate-400 text-sm">
                          ${(item.amount || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tax Amount</label>
                  <input
                    type="number"
                    value={formData.tax}
                    onChange={(e) => {
                      const tax = parseFloat(e.target.value) || 0
                      setFormData(prev => ({
                        ...prev,
                        tax,
                        total: prev.subtotal + tax
                      }))
                    }}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Subtotal</label>
                  <div className="px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-slate-400">
                    ${formData.subtotal.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Total</label>
                  <div className="px-4 py-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-400 font-semibold">
                    ${formData.total.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Valid Until *</label>
                  <input
                    type="date"
                    value={formData.validUntil instanceof Date ? formData.validUntil.toISOString().split('T')[0] : formData.validUntil}
                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Notes and Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all resize-none"
                    placeholder="Internal notes"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Terms & Conditions</label>
                  <textarea
                    value={formData.terms}
                    onChange={(e) => handleInputChange('terms', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all resize-none"
                    placeholder="Terms and conditions"
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setProjectData(null)
                    setClientData(null)
                    setLeadData(null)
                  }}
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
                    <FileText className="w-5 h-5" />
                  )}
                  <span>{saving ? 'Creating...' : 'Create Quote'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Quote Creation Confirmation Modal */}
      {showQuoteConfirmation && pendingQuoteData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Confirm Quote Creation</h3>
                <p className="text-slate-400 text-sm">Please review the quote details before creating</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-sm text-slate-300">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Quote Title:</span>
                    <span className="font-medium">{pendingQuoteData.title}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Client:</span>
                    <span className="font-medium">{pendingQuoteData.clientName}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Project:</span>
                    <span className="font-medium">{projects.find(p => p._id === pendingQuoteData.projectId)?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Amount:</span>
                    <span className="font-semibold text-emerald-400">${pendingQuoteData.total?.toFixed(2)} {pendingQuoteData.currency}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleCancelQuoteCreation}
                disabled={saving}
                className="flex-1 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmQuoteCreation}
                disabled={saving}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 font-medium"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <FileText className="w-6 h-6" />
                )}
                <span>{saving ? 'Creating...' : 'Create Quote'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Proposal Generator Modal */}
      <AIProposalGenerator
        isOpen={showAIProposalGenerator}
        onClose={() => setShowAIProposalGenerator(false)}
        leadId={selectedLeadForAI?.id}
        leadData={selectedLeadForAI || {}}
        onProposalGenerated={handleAIProposalGenerated}
      />
    </div>
  )
}

export default Quotes 