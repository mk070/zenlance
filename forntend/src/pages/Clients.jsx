import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit3,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  Save,
  User,
  Building2,
  FileText,
  CreditCard,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'

const Clients = () => {
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showSlidePanel, setShowSlidePanel] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form data for create/edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    address: '',
    city: '',
    country: '',
    website: '',
    status: 'active',
    priority: 'medium',
    contractValue: '',
    paymentTerms: '',
    notes: '',
    tags: [],
    projects: 0,
    totalRevenue: 0
  })

  const clientStatuses = [
    { value: 'active', label: 'Active', color: 'bg-green-500', icon: CheckCircle2 },
    { value: 'inactive', label: 'Inactive', color: 'bg-gray-500', icon: Clock },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500', icon: AlertTriangle },
    { value: 'suspended', label: 'Suspended', color: 'bg-red-500', icon: X }
  ]

  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'bg-blue-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'critical', label: 'Critical', color: 'bg-red-500' }
  ]

  const paymentTerms = [
    'Net 15', 'Net 30', 'Net 45', 'Net 60', 
    'Due on Receipt', 'COD', 'Prepaid', '2/10 Net 30'
  ]

  // Mock data - Replace with API calls
  useEffect(() => {
    const mockClients = [
      {
        id: 1,
        name: 'Sarah Johnson',
        email: 'sarah@techcorp.com',
        phone: '+1 (555) 123-4567',
        company: 'TechCorp Inc.',
        position: 'CTO',
        address: '123 Tech Street',
        city: 'San Francisco',
        country: 'USA',
        website: 'https://techcorp.com',
        status: 'active',
        priority: 'high',
        contractValue: '150000',
        paymentTerms: 'Net 30',
        notes: 'Long-term enterprise client. Excellent relationship.',
        tags: ['enterprise', 'vip'],
        projects: 3,
        totalRevenue: 450000,
        createdAt: '2023-12-15',
        lastContact: '2024-01-20'
      },
      {
        id: 2,
        name: 'Michael Chen',
        email: 'michael@startupco.com',
        phone: '+1 (555) 987-6543',
        company: 'StartupCo',
        position: 'Founder',
        address: '456 Innovation Ave',
        city: 'Austin',
        country: 'USA',
        website: 'https://startupco.com',
        status: 'active',
        priority: 'medium',
        contractValue: '75000',
        paymentTerms: 'Net 15',
        notes: 'Fast-growing startup. Regular monthly retainer.',
        tags: ['startup', 'retainer'],
        projects: 2,
        totalRevenue: 125000,
        createdAt: '2024-01-05',
        lastContact: '2024-01-18'
      },
      {
        id: 3,
        name: 'Emma Davis',
        email: 'emma@consulting.com',
        phone: '+1 (555) 456-7890',
        company: 'Davis Consulting',
        position: 'Principal',
        address: '789 Business Blvd',
        city: 'New York',
        country: 'USA',
        website: 'https://davisconsulting.com',
        status: 'inactive',
        priority: 'low',
        contractValue: '25000',
        paymentTerms: 'Net 45',
        notes: 'Project completed. Potential for future work.',
        tags: ['consulting', 'completed'],
        projects: 1,
        totalRevenue: 25000,
        createdAt: '2023-11-20',
        lastContact: '2023-12-15'
      }
    ]
    setClients(mockClients)
    setFilteredClients(mockClients)
  }, [])

  // Filter and search functionality
  useEffect(() => {
    let filtered = clients

    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => client.status === filterStatus)
    }

    setFilteredClients(filtered)
  }, [clients, searchTerm, filterStatus])

  const getStatusConfig = (status) => {
    return clientStatuses.find(s => s.value === status) || clientStatuses[0]
  }

  const getPriorityConfig = (priority) => {
    return priorityLevels.find(p => p.value === priority) || priorityLevels[1]
  }

  const handleCreateClient = () => {
    setSelectedClient(null)
    setIsEditing(false)
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      address: '',
      city: '',
      country: '',
      website: '',
      status: 'active',
      priority: 'medium',
      contractValue: '',
      paymentTerms: '',
      notes: '',
      tags: [],
      projects: 0,
      totalRevenue: 0
    })
    setShowSlidePanel(true)
  }

  const handleEditClient = (client) => {
    setSelectedClient(client)
    setIsEditing(true)
    setFormData({ ...client })
    setShowSlidePanel(true)
  }

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      setClients(clients.filter(client => client.id !== clientId))
      toast.success('Client deleted successfully')
    }
  }

  const handleViewClient = (client) => {
    // Navigate to client detail page
    toast.info(`Viewing ${client.name}'s profile`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditing) {
        // Update existing client
        setClients(clients.map(client => 
          client.id === selectedClient.id ? { ...formData, id: selectedClient.id } : client
        ))
        toast.success('Client updated successfully!')
      } else {
        // Create new client
        const newClient = {
          ...formData,
          id: Date.now(),
          createdAt: new Date().toISOString().split('T')[0],
          lastContact: new Date().toISOString().split('T')[0]
        }
        setClients([newClient, ...clients])
        toast.success('Client created successfully!')
      }
      setShowSlidePanel(false)
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="h-full bg-transparent text-white">
      {/* Header */}
      <div className="border-b border-gray-800/50 bg-black/40 backdrop-blur-xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-white">Clients</h1>
              <p className="text-sm text-gray-400 mt-1">
                Manage your client relationships and projects
              </p>
            </div>
            <motion.button
              onClick={handleCreateClient}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Client</span>
            </motion.button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Status</option>
              {clientStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-900/20 backdrop-blur-xl border border-gray-800/50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Clients</p>
                <p className="text-xl font-light text-white">{clients.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/20 backdrop-blur-xl border border-gray-800/50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Clients</p>
                <p className="text-xl font-light text-white">
                  {clients.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/20 backdrop-blur-xl border border-gray-800/50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Projects</p>
                <p className="text-xl font-light text-white">
                  {clients.reduce((sum, client) => sum + (client.projects || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/20 backdrop-blur-xl border border-gray-800/50 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-xl font-light text-white">
                  ${clients.reduce((sum, client) => sum + (client.totalRevenue || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-gray-900/20 backdrop-blur-xl border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Projects</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredClients.map((client) => {
                  const statusConfig = getStatusConfig(client.status)
                  const priorityConfig = getPriorityConfig(client.priority)
                  return (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">{client.name}</div>
                          <div className="text-sm text-gray-400">{client.email}</div>
                          <div className="text-sm text-gray-400">{client.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">{client.company}</div>
                          <div className="text-sm text-gray-400">{client.position}</div>
                          <div className="text-sm text-gray-400">{client.city}, {client.country}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}/20 text-white`}>
                          <statusConfig.icon className="h-3 w-3" />
                          <span>{statusConfig.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig.color}/20 text-white`}>
                          {priorityConfig.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {client.projects || 0}
                      </td>
                      <td className="px-6 py-4 text-white">
                        ${(client.totalRevenue || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {client.lastContact}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <motion.button
                            onClick={() => handleViewClient(client)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                            title="View Client"
                          >
                            <Eye className="h-4 w-4" />
                          </motion.button>
                          
                          <motion.button
                            onClick={() => handleEditClient(client)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </motion.button>
                          
                          <motion.button
                            onClick={() => handleDeleteClient(client.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-in Panel */}
      <AnimatePresence>
        {showSlidePanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSlidePanel(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Slide Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-900/95 backdrop-blur-xl border-l border-gray-800/50 z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-light text-white">
                    {isEditing ? 'Edit Client' : 'Create New Client'}
                  </h2>
                  <button
                    onClick={() => setShowSlidePanel(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Basic Information
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Enter email address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Company Information
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Enter company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Position
                      </label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Enter job position"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Address Information
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Enter street address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Enter city"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                          placeholder="Enter country"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Client Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Client Details
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          {clientStatuses.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Priority
                        </label>
                        <select
                          name="priority"
                          value={formData.priority}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          {priorityLevels.map(priority => (
                            <option key={priority.value} value={priority.value}>
                              {priority.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contract Value ($)
                      </label>
                      <input
                        type="number"
                        name="contractValue"
                        value={formData.contractValue}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Enter contract value"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Payment Terms
                      </label>
                      <select
                        name="paymentTerms"
                        value={formData.paymentTerms}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="">Select payment terms</option>
                        {paymentTerms.map(term => (
                          <option key={term} value={term}>{term}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                        placeholder="Add notes about this client..."
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-4 pt-6 border-t border-gray-800/50">
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-white text-black py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>{isEditing ? 'Update' : 'Create'} Client</span>
                        </>
                      )}
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      onClick={() => setShowSlidePanel(false)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 border border-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Clients 