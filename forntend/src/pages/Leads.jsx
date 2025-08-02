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
  Tag,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const Leads = () => {
  const [leads, setLeads] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showSlidePanel, setShowSlidePanel] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form data for create/edit
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    source: '',
    status: 'new',
    value: '',
    notes: '',
    assignedTo: '',
    tags: []
  })

  const leadSources = [
    'Website', 'Social Media', 'Email Campaign', 'Referral', 
    'Cold Call', 'Trade Show', 'Content Marketing', 'Partner', 'Other'
  ]

  const leadStatuses = [
    { value: 'new', label: 'New', color: 'bg-blue-500', icon: Clock },
    { value: 'contacted', label: 'Contacted', color: 'bg-yellow-500', icon: Phone },
    { value: 'qualified', label: 'Qualified', color: 'bg-purple-500', icon: CheckCircle2 },
    { value: 'proposal', label: 'Proposal Sent', color: 'bg-orange-500', icon: FileText },
    { value: 'negotiation', label: 'Negotiation', color: 'bg-indigo-500', icon: TrendingUp },
    { value: 'won', label: 'Won', color: 'bg-green-500', icon: CheckCircle2 },
    { value: 'lost', label: 'Lost', color: 'bg-red-500', icon: X },
    { value: 'nurturing', label: 'Nurturing', color: 'bg-gray-500', icon: AlertCircle }
  ]

  // Mock data - Replace with API calls
  useEffect(() => {
    const mockLeads = [
      {
        id: 1,
        name: 'John Smith',
        email: 'john@techcorp.com',
        phone: '+1 (555) 123-4567',
        company: 'TechCorp Inc.',
        position: 'CTO',
        source: 'Website',
        status: 'qualified',
        value: '25000',
        notes: 'Interested in enterprise solution. Follow up next week.',
        assignedTo: 'Sarah Johnson',
        tags: ['enterprise', 'hot-lead'],
        createdAt: '2024-01-15',
        lastContact: '2024-01-20'
      },
      {
        id: 2,
        name: 'Emily Davis',
        email: 'emily@startupco.com',
        phone: '+1 (555) 987-6543',
        company: 'StartupCo',
        position: 'Founder',
        source: 'Social Media',
        status: 'new',
        value: '12000',
        notes: 'Early stage startup, budget conscious.',
        assignedTo: 'Mike Wilson',
        tags: ['startup', 'budget-conscious'],
        createdAt: '2024-01-18',
        lastContact: '2024-01-18'
      },
      {
        id: 3,
        name: 'Robert Chen',
        email: 'robert@innovate.com',
        phone: '+1 (555) 456-7890',
        company: 'Innovate Solutions',
        position: 'VP Marketing',
        source: 'Referral',
        status: 'proposal',
        value: '35000',
        notes: 'Referred by existing client. High priority.',
        assignedTo: 'Sarah Johnson',
        tags: ['referral', 'high-priority'],
        createdAt: '2024-01-10',
        lastContact: '2024-01-22'
      }
    ]
    setLeads(mockLeads)
    setFilteredLeads(mockLeads)
  }, [])

  // Filter and search functionality
  useEffect(() => {
    let filtered = leads

    if (searchTerm) {
      filtered = filtered.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => lead.status === filterStatus)
    }

    setFilteredLeads(filtered)
  }, [leads, searchTerm, filterStatus])

  const getStatusConfig = (status) => {
    return leadStatuses.find(s => s.value === status) || leadStatuses[0]
  }

  const handleCreateLead = () => {
    setSelectedLead(null)
    setIsEditing(false)
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      source: '',
      status: 'new',
      value: '',
      notes: '',
      assignedTo: '',
      tags: []
    })
    setShowSlidePanel(true)
  }

  const handleEditLead = (lead) => {
    setSelectedLead(lead)
    setIsEditing(true)
    setFormData({ ...lead })
    setShowSlidePanel(true)
  }

  const handleDeleteLead = async (leadId) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      setLeads(leads.filter(lead => lead.id !== leadId))
      toast.success('Lead deleted successfully')
    }
  }

  const handleConvertToClient = async (leadId) => {
    const lead = leads.find(l => l.id === leadId)
    if (lead && window.confirm(`Convert "${lead.name}" to client?`)) {
      // Here you would call your API to convert lead to client
      setLeads(leads.filter(l => l.id !== leadId))
      toast.success('Lead converted to client successfully!')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditing) {
        // Update existing lead
        setLeads(leads.map(lead => 
          lead.id === selectedLead.id ? { ...formData, id: selectedLead.id } : lead
        ))
        toast.success('Lead updated successfully!')
      } else {
        // Create new lead
        const newLead = {
          ...formData,
          id: Date.now(),
          createdAt: new Date().toISOString().split('T')[0],
          lastContact: new Date().toISOString().split('T')[0]
        }
        setLeads([newLead, ...leads])
        toast.success('Lead created successfully!')
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
              <h1 className="text-2xl font-light text-white">Leads</h1>
              <p className="text-sm text-gray-400 mt-1">
                Manage and track your sales leads
              </p>
            </div>
            <motion.button
              onClick={handleCreateLead}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Lead</span>
            </motion.button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mt-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
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
              {leadStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="p-6">
        <div className="bg-gray-900/20 backdrop-blur-xl border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Lead</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredLeads.map((lead) => {
                  const statusConfig = getStatusConfig(lead.status)
                  return (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">{lead.name}</div>
                          <div className="text-sm text-gray-400">{lead.email}</div>
                          <div className="text-sm text-gray-400">{lead.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-white">{lead.company}</div>
                          <div className="text-sm text-gray-400">{lead.position}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}/20 text-white`}>
                          <statusConfig.icon className="h-3 w-3" />
                          <span>{statusConfig.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">
                        ${parseInt(lead.value).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {lead.lastContact}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <motion.button
                            onClick={() => handleEditLead(lead)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </motion.button>
                          
                          {lead.status === 'won' && (
                            <motion.button
                              onClick={() => handleConvertToClient(lead.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-1 text-green-400 hover:text-green-300 transition-colors"
                              title="Convert to Client"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </motion.button>
                          )}
                          
                          <motion.button
                            onClick={() => handleDeleteLead(lead.id)}
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
                    {isEditing ? 'Edit Lead' : 'Create New Lead'}
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
                  </div>

                  {/* Lead Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
                      Lead Details
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Source
                      </label>
                      <select
                        name="source"
                        value={formData.source}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="">Select source</option>
                        {leadSources.map(source => (
                          <option key={source} value={source}>{source}</option>
                        ))}
                      </select>
                    </div>

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
                        {leadStatuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Potential Value ($)
                      </label>
                      <input
                        type="number"
                        name="value"
                        value={formData.value}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Enter potential value"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Assigned To
                      </label>
                      <input
                        type="text"
                        name="assignedTo"
                        value={formData.assignedTo}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Assign to team member"
                      />
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
                        placeholder="Add notes about this lead..."
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
                          <span>{isEditing ? 'Update' : 'Create'} Lead</span>
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

export default Leads 