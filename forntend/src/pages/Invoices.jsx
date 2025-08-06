import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  User, 
  DollarSign, 
  Calendar,
  Clock,
  CheckCircle,
  Send,
  AlertTriangle,
  X,
  Eye,
  Edit,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Save,
  Building2,
  FolderOpen
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const Invoices = () => {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  
  // Create invoice modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form data for creating invoices
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  
  // Invoice form data
  const [formData, setFormData] = useState(() => {
    // Set default due date to 30 days from now
    const defaultDueDate = new Date()
    defaultDueDate.setDate(defaultDueDate.getDate() + 30)
    
    return {
      title: '',
      description: '',
      clientId: '',
      clientName: '',
      clientEmail: '',
      projectId: '',
      dueDate: defaultDueDate.toISOString().split('T')[0], // YYYY-MM-DD format
      items: [{
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0
      }],
      tax: 0,
      discount: 0,
      subtotal: 0,
      total: 0,
      currency: 'USD',
      notes: '',
      status: 'draft'
    }
  })

  // Load invoices from API
  const loadInvoices = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true)
      
      const params = {
        page,
        limit: pagination.limit || 20,
        ...(search && search.trim() && { search: search.trim() }),
        ...(status && status !== 'all' && { status })
      }
      
      console.log('Loading invoices with params:', params)
      
      const result = await apiClient.getInvoices(params)
      
      console.log('Invoice API response:', result)
      
      if (result.success) {
        const invoicesData = result.data.invoices || result.data || []
        setInvoices(Array.isArray(invoicesData) ? invoicesData : [])
        setPagination({
          page: result.data.page || 1,
          limit: result.data.limit || 20,
          total: result.data.total || 0,
          pages: result.data.pages || Math.ceil((result.data.total || 0) / (result.data.limit || 20))
        })
      } else {
        console.error('API returned success: false:', result)
        // Don't show error for empty results, just set empty state
        setInvoices([])
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        })
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
      
      // Only show error toast if it's not a 404 (no invoices found)
      if (!error.message?.includes('404')) {
        toast.error('Failed to load invoices')
      }
      
      // Fallback to empty state
      setInvoices([])
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      })
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  // Load clients from API
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

  // Load projects from API
  const loadProjects = async () => {
    try {
      setLoadingProjects(true)
      const result = await apiClient.getProjects()
      if (result.success) {
        const projectsData = Array.isArray(result.data) ? result.data : (result.data.projects || [])
        setProjects(projectsData)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  const refreshInvoices = async () => {
    setRefreshing(true)
    await loadInvoices(pagination.page, searchTerm, filterStatus)
    setRefreshing(false)
    toast.success('Invoices refreshed')
  }

  const handleSearch = (query) => {
    setSearchTerm(query)
    loadInvoices(1, query, filterStatus)
  }

  const handleStatusFilter = (status) => {
    setFilterStatus(status)
    loadInvoices(1, searchTerm, status)
  }

  const handleViewInvoice = (invoice) => {
    navigate(`/invoices/${invoice.id}`)
  }

  const handlePageChange = (newPage) => {
    loadInvoices(newPage, searchTerm, filterStatus)
  }

  // Form handling functions
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-populate client details when clientId changes
    if (field === 'clientId' && value) {
      const selectedClient = clients.find(client => client._id === value)
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          clientName: selectedClient.name || `${selectedClient.firstName || ''} ${selectedClient.lastName || ''}`.trim() || 'Unknown Client',
          clientEmail: selectedClient.email || selectedClient.contactEmail || 'unknown@email.com',
          projectId: '' // Reset project selection when client changes
        }))
        
        // Filter projects by selected client
        const clientProjects = projects.filter(project => {
          if (typeof project.clientId === 'string') {
            return project.clientId === value
          } else if (typeof project.clientId === 'object' && project.clientId?._id) {
            return project.clientId._id === value
          }
          return false
        })
        setFilteredProjects(clientProjects)
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
          title: `Invoice for ${selectedProject.name}`,
          description: selectedProject.description || `Invoice for project: ${selectedProject.name}`,
          items: [{
            description: selectedProject.name || 'Project Services',
            quantity: 1,
            rate: selectedProject.budget || 0,
            amount: selectedProject.budget || 0
          }]
        }))
      }
    }
  }

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value }
          // Recalculate amount when quantity or rate changes
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate
          }
          return updatedItem
        }
        return item
      })
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
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }))
    }
  }

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0)
    const taxAmount = (subtotal * (formData.tax || 0)) / 100
    const discountAmount = (subtotal * (formData.discount || 0)) / 100
    const total = subtotal + taxAmount - discountAmount

    return {
      subtotal,
      taxAmount,
      discountAmount,
      total
    }
  }

  const handleCreateInvoice = async () => {
    try {
      // Enhanced validation
      console.log('Validating form data:', formData)
      
      if (!formData.title || !formData.title.trim()) {
        toast.error('Invoice title is required')
        return
      }
      
      if (!formData.clientId) {
        toast.error('Client is required')
        return
      }
      
      if (!formData.dueDate) {
        toast.error('Due date is required')
        return
      }

      // Validate due date format
      if (!formData.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        toast.error('Due date must be in YYYY-MM-DD format')
        return
      }

      if (!formData.items || formData.items.length === 0) {
        toast.error('At least one item is required')
        return
      }

      // Detailed item validation
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i]
        if (!item.description || !item.description.trim()) {
          toast.error(`Item ${i + 1}: Description is required`)
          return
        }
        if (!item.quantity || item.quantity <= 0) {
          toast.error(`Item ${i + 1}: Quantity must be greater than 0`)
          return
        }
        if (!item.rate || item.rate <= 0) {
          toast.error(`Item ${i + 1}: Rate must be greater than 0`)
          return
        }
      }

      setSaving(true)
      
      // Find the selected client to log its details
      const selectedClient = clients.find(client => client._id === formData.clientId)
      console.log('Selected client details:', {
        _id: selectedClient?._id,
        firstName: selectedClient?.firstName,
        lastName: selectedClient?.lastName,
        email: selectedClient?.email,
        relationshipManager: selectedClient?.relationshipManager,
        createdBy: selectedClient?.createdBy,
        isActive: selectedClient?.isActive
      })
      
              // Calculate totals (matching backend calculateAmounts method)
        const items = formData.items.map(item => {
          const quantity = parseFloat(item.quantity) || 1
          const rate = parseFloat(item.rate) || 0
          const amount = quantity * rate
          return {
            description: item.description.trim(),
            quantity,
            rate,
            amount
          }
        })

        const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
        const tax = parseFloat(formData.tax) || 0
        const discount = parseFloat(formData.discount) || 0
        const taxAmount = (subtotal * tax) / 100
        const discountAmount = (subtotal * discount) / 100
        const total = subtotal + taxAmount - discountAmount

        // Generate a temporary invoice number (backend will override this)
        const date = new Date()
        const year = date.getFullYear().toString().slice(-2)
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const tempInvoiceNumber = `INV-${year}${month}-TEMP`

        // Prepare invoice data according to backend schema
        const invoiceData = {
          invoiceNumber: tempInvoiceNumber, // Backend will override this
          title: formData.title.trim(),
          description: formData.description?.trim() || '',
          clientId: formData.clientId,
          clientName: selectedClient?.firstName + ' ' + selectedClient?.lastName || 'Unknown Client',
          clientEmail: selectedClient?.email || 'unknown@email.com',
          dueDate: new Date(formData.dueDate).toISOString(),
          items,
          subtotal,
          tax,
          taxAmount,
          discount,
          discountAmount,
          total,
          currency: formData.currency || 'USD',
          notes: formData.notes?.trim() || '',
          status: formData.status || 'draft'
        }

      console.log('Sending invoice data:', JSON.stringify(invoiceData, null, 2))

      const result = await apiClient.createInvoice(invoiceData)
      
      if (result.success) {
        toast.success('Invoice created successfully!')
        setShowCreateModal(false)
        resetForm()
        await loadInvoices() // Refresh the invoice list
      } else {
        console.error('API returned error:', result)
        toast.error(result.error || result.message || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      console.error('Error message:', error.message)
      console.error('Error status:', error.status)
      console.error('Error data:', JSON.stringify(error.data, null, 2))
      
      // If it's a response object, try to get more details
      if (error.response) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2))
      }
      
      // Show specific validation errors if available
      if (error.data && error.data.errors) {
        const errorMessages = Array.isArray(error.data.errors) 
          ? error.data.errors.join(', ')
          : error.data.errors
        toast.error(`Validation errors: ${errorMessages}`)
      } else if (error.data && error.data.message) {
        toast.error(error.data.message)
      } else if (error.message && error.message.includes('Validation')) {
        toast.error('Please check all required fields and try again')
      } else {
        toast.error('Failed to create invoice')
      }
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    // Set default due date to 30 days from now
    const defaultDueDate = new Date()
    defaultDueDate.setDate(defaultDueDate.getDate() + 30)
    
    setFormData({
      title: '',
      description: '',
      clientId: '',
      clientName: '',
      clientEmail: '',
      projectId: '',
      dueDate: defaultDueDate.toISOString().split('T')[0], // YYYY-MM-DD format
      items: [{
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0
      }],
      tax: 0,
      discount: 0,
      subtotal: 0,
      total: 0,
      currency: 'USD',
      notes: '',
      status: 'draft'
    })
    setFilteredProjects([])
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
    loadClients()
    loadProjects()
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'sent':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'draft':
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
      case 'overdue':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'cancelled':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return CheckCircle
      case 'sent':
        return Send
      case 'draft':
        return FileText
      case 'overdue':
        return AlertTriangle
      case 'cancelled':
        return X
      default:
        return FileText
    }
  }

  const filteredInvoices = invoices

  if (initialLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading invoices...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-white mb-2">Invoices</h1>
            <p className="text-slate-400 font-light">
              Create, send, and track your invoices and payments
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshInvoices}
              disabled={refreshing}
              className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={openCreateModal}
              className="flex items-center space-x-2 px-6 py-3 bg-cyan-400 hover:bg-cyan-500 text-black rounded-xl transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Create Invoice</span>
            </button>
          </div>
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
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="appearance-none bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
            >
              <option value="all" className="bg-slate-800">All Status</option>
              <option value="draft" className="bg-slate-800">Draft</option>
              <option value="sent" className="bg-slate-800">Sent</option>
              <option value="paid" className="bg-slate-800">Paid</option>
              <option value="overdue" className="bg-slate-800">Overdue</option>
              <option value="cancelled" className="bg-slate-800">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {/* Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden mb-6"
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No invoices found</h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first invoice to get started'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-cyan-400 hover:bg-cyan-500 text-black rounded-xl transition-colors font-medium"
              >
                Create Your First Invoice
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-400">
                <div className="col-span-3">Invoice</div>
                <div className="col-span-3">Client</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Due Date</div>
              </div>
            </div>

            {/* Invoices */}
            <div className="divide-y divide-white/10">
              {filteredInvoices.map((invoice, index) => {
                const StatusIcon = getStatusIcon(invoice.status)
                return (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    onClick={() => handleViewInvoice(invoice)}
                    className="px-6 py-4 hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Invoice Info */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-400/20">
                            <FileText className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium group-hover:text-cyan-300 transition-colors">
                              {invoice.invoiceNumber || `INV-${invoice._id?.slice(-6)}`}
                            </p>
                            <p className="text-slate-400 text-sm truncate">{invoice.title}</p>
                          </div>
                        </div>
                      </div>

                      {/* Client */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300 truncate">
                            {invoice.clientName || invoice.client?.name || invoice.client?.firstName + ' ' + invoice.client?.lastName || 'Unknown Client'}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <span className="text-white font-medium">
                            ${(invoice.total || invoice.amount || 0).toLocaleString()} {invoice.currency || 'USD'}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="w-4 h-4 text-slate-400" />
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Due Date */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300 text-sm">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
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
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} invoices
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

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-white flex items-center">
                <FileText className="w-6 h-6 mr-3 text-cyan-400" />
                Create New Invoice
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-6">
              {/* Client and Project Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Client <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleInputChange('clientId', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project (Optional)
                  </label>
                  <select
                    value={formData.projectId || ''}
                    onChange={(e) => handleInputChange('projectId', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all"
                    disabled={loadingProjects || !formData.clientId}
                  >
                    <option value="">
                      {loadingProjects ? 'Loading projects...' : 
                       !formData.clientId ? 'Select a client first' :
                       filteredProjects.length === 0 ? 'No projects found for this client' :
                       'Select a project (optional)'}
                    </option>
                    {filteredProjects.map(project => (
                      <option key={project._id} value={project._id} className="bg-slate-800 text-white">
                        {project.name} - ${project.budget?.toLocaleString() || 'No budget'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Invoice Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    placeholder="Enter invoice title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Due Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none"
                  placeholder="Invoice description"
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">Invoice Items</h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center space-x-2 px-3 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4">
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                            placeholder="Item description"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-300 mb-2">Qty</label>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Rate <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                          <div className="px-3 py-2 bg-slate-600/50 border border-white/10 rounded-lg text-slate-300">
                            ${(item.amount || 0).toFixed(2)}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            disabled={formData.items.length === 1}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tax (%)</label>
                  <input
                    type="number"
                    value={formData.tax}
                    onChange={(e) => handleInputChange('tax', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Discount (%)</label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => handleInputChange('discount', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  >
                    <option value="USD" className="bg-slate-800">USD ($)</option>
                    <option value="EUR" className="bg-slate-800">EUR (€)</option>
                    <option value="GBP" className="bg-slate-800">GBP (£)</option>
                    <option value="CAD" className="bg-slate-800">CAD (C$)</option>
                  </select>
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">Invoice Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal:</span>
                    <span>${calculateTotals().subtotal.toFixed(2)} {formData.currency}</span>
                  </div>
                  {formData.tax > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Tax ({formData.tax}%):</span>
                      <span>${calculateTotals().taxAmount.toFixed(2)} {formData.currency}</span>
                    </div>
                  )}
                  {formData.discount > 0 && (
                    <div className="flex justify-between text-slate-300">
                      <span>Discount ({formData.discount}%):</span>
                      <span>-${calculateTotals().discountAmount.toFixed(2)} {formData.currency}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold text-white border-t border-white/10 pt-2">
                    <span>Total:</span>
                    <span>${calculateTotals().total.toFixed(2)} {formData.currency}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 resize-none"
                  placeholder="Additional notes for the invoice"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={saving}
                  className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateInvoice}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 font-medium"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{saving ? 'Creating...' : 'Create Invoice'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Invoices 