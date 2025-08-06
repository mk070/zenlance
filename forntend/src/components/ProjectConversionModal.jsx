import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  FolderPlus, 
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Building2,
  User
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const ProjectConversionModal = ({ isOpen, onClose, lead, onProjectCreated }) => {
  const [loading, setLoading] = useState(false)
  const [nameAvailable, setNameAvailable] = useState(true)
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'draft',
    priority: 'medium',
    budget: '',
    currency: 'USD',
    startDate: '',
    endDate: '',
    clientId: '',
    clientName: '',
    tags: [],
    notes: '',
    requirements: {
      scope: ''
    }
  })

  // Load clients when modal opens
  useEffect(() => {
    const loadClients = async () => {
      if (!isOpen) return
      
      try {
        setLoadingClients(true)
        const result = await apiClient.getClients({ limit: 100 })
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
    
    loadClients()
  }, [isOpen])

  // Initialize form data when lead changes
  useEffect(() => {
    if (lead && isOpen) {
      const firstName = lead.firstName?.trim() || ''
      const lastName = lead.lastName?.trim() || ''
      const company = lead.company?.trim() || ''
      
      const leadName = `${firstName} ${lastName}`.trim()
      const projectName = company ? 
        `${company} Project` : 
        leadName ? `${leadName} Project` : 'New Project'
      
      const clientName = company || leadName || 'Unknown Client'
      
      const description = lead.description?.trim() || 
        `Project for ${leadName || company || 'client'}${company && leadName ? ` from ${company}` : ''}`

      // Build notes with lead information
      const noteLines = [`Converted from lead: ${leadName || 'Unknown'}`]
      if (lead.email?.trim()) noteLines.push(`Email: ${lead.email.trim()}`)
      if (lead.phone?.trim()) noteLines.push(`Phone: ${lead.phone.trim()}`)
      if (company) noteLines.push(`Company: ${company}`)
      if (lead.industry?.trim()) noteLines.push(`Industry: ${lead.industry.trim()}`)
      if (lead.source?.trim()) noteLines.push(`Source: ${lead.source.trim()}`)

      // Try to find matching client by email or name
      let matchingClientId = ''
      if (clients.length > 0 && lead.email) {
        const matchingClient = clients.find(client => 
          client.email?.toLowerCase() === lead.email.toLowerCase()
        )
        if (matchingClient) {
          matchingClientId = matchingClient._id
        }
      }

      setFormData({
        name: projectName,
        description: description,
        status: 'draft',
        priority: ['low', 'medium', 'high', 'urgent'].includes(lead.priority) ? lead.priority : 'medium',
        budget: lead.budget?.max || lead.budget?.min || '',
        currency: (lead.budget?.currency && ['USD', 'EUR', 'GBP', 'CAD'].includes(lead.budget.currency)) ? 
          lead.budget.currency : 'USD',
        startDate: lead.timeline?.startDate || '',
        endDate: lead.timeline?.endDate || '',
        clientId: matchingClientId,
        clientName: clientName,
        tags: Array.isArray(lead.tags) ? lead.tags : [],
        notes: noteLines.join('\n'),
        // Carry over requirements from lead
        requirements: {
          scope: lead.requirements?.scope || ''
        }
      })
    }
  }, [lead, isOpen, clients])

  const generateUniqueProjectName = () => {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
    const baseName = formData.name.replace(/ \(\d{4}-\d{2}-\d{2} \d{2}:\d{2}\)$/, '') // Remove existing timestamp
    const uniqueName = `${baseName} (${timestamp})`
    
    setFormData(prev => ({
      ...prev,
      name: uniqueName
    }))
    
    setNameAvailable(true)
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

    // Reset name availability when name changes
    if (field === 'name') {
      setNameAvailable(true)
    }
  }



  const handleSubmit = async (retryCount = 0) => {
    try {
      setLoading(true)

      // Validate required fields
      if (!formData.name?.trim()) {
        toast.error('Project name is required')
        return
      }

      if (!formData.clientId && !formData.clientName?.trim()) {
        toast.error('Please select a client or provide a client name')
        return
      }

      // Validate required requirements field
      if (!formData.requirements?.scope?.trim()) {
        toast.error('Project requirements are required')
        return
      }

      // If this is a retry due to duplicate name, append timestamp
      let projectName = formData.name.trim()
      if (retryCount > 0) {
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
        projectName = `${formData.name.trim()} (${timestamp})`
      }

      // Prepare project data
      const projectData = {
        name: projectName,
        description: formData.description?.trim(),
        status: formData.status,
        priority: formData.priority,
        currency: formData.currency,
        tags: formData.tags || []
      }

      // Add client information
      if (formData.clientId) {
        // Use existing client
        projectData.clientId = formData.clientId
      } else {
        // Create new client from lead data
        projectData.leadData = {
          firstName: lead.firstName || lead.name?.split(' ')[0] || 'Unknown',
          lastName: lead.lastName || lead.name?.split(' ').slice(1).join(' ') || '',
          email: lead.email,
          phone: lead.phone || '',
          company: lead.company || '',
          source: lead.source || 'Lead Conversion',
          name: lead.name
        }
      }

      // Add optional fields only if they have valid values
      if (formData.budget && !isNaN(Number(formData.budget)) && Number(formData.budget) > 0) {
        projectData.budget = Number(formData.budget)
      }

      if (formData.startDate) {
        try {
          const startDate = new Date(formData.startDate)
          if (!isNaN(startDate.getTime())) {
            projectData.startDate = formData.startDate
          }
        } catch (e) {
          console.warn('Invalid start date:', formData.startDate)
        }
      }

      if (formData.endDate) {
        try {
          const endDate = new Date(formData.endDate)
          if (!isNaN(endDate.getTime())) {
            projectData.endDate = formData.endDate
          }
        } catch (e) {
          console.warn('Invalid end date:', formData.endDate)
        }
      }

      if (formData.notes?.trim()) {
        projectData.notes = formData.notes.trim()
      }

      // Add requirements if any exist
      if (formData.requirements?.scope?.trim()) {
        projectData.requirements = {
          scope: formData.requirements.scope.trim()
        }
      }

      console.log('🚀 Creating project with data:', JSON.stringify(projectData, null, 2))

      const result = await apiClient.createProject(projectData)

      if (result?.success === true) {
        if (retryCount > 0) {
          toast.success(`Project created as "${projectName}" (name was automatically adjusted)`)
        } else {
          toast.success('Lead converted to project successfully!')
        }
        onProjectCreated(result.data)
        onClose()
      } else {
        const errorMessage = result?.message || result?.error || 'Project creation failed'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('💥 Error creating project:', error)
      
      // Handle duplicate name error specifically
      if (error?.message?.includes('already exists') && retryCount < 3) {
        console.log(`🔄 Retrying with unique name (attempt ${retryCount + 1})`)
        setNameAvailable(false)
        return handleSubmit(retryCount + 1)
      }
      
      let userMessage = 'Failed to convert lead to project'
      if (error?.response?.data?.message) {
        userMessage = error.response.data.message
      } else if (error?.data?.message) {
        userMessage = error.data.message
      } else if (error?.message && error.message !== '[object Object]') {
        userMessage = error.message
      }
      
      if (error?.message?.includes('already exists')) {
        userMessage = `Project name "${formData.name}" already exists. Please choose a different name.`
      }
      
      toast.error(userMessage)
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'contracted', label: 'Contracted' },
    { value: 'in_progress', label: 'In Progress' }
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ]

  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' }
  ]

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <FolderPlus className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Convert to Project</h2>
                <p className="text-sm text-slate-400">Configure project details before creation</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 bg-slate-800 border rounded-xl text-white focus:outline-none focus:ring-2 focus:border-transparent pr-20 ${
                        !nameAvailable ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-blue-500'
                      }`}
                      placeholder="Enter project name"
                    />
                    {!nameAvailable && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  {!nameAvailable && (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-red-400 text-sm">This project name already exists</p>
                      <button
                        type="button"
                        onClick={generateUniqueProjectName}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Generate Unique Name
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Client *
                  </label>
                  {loadingClients ? (
                    <div className="flex items-center justify-center py-3 bg-slate-800 border border-slate-600 rounded-xl">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin mr-2"></div>
                      <span className="text-slate-400 text-sm">Loading clients...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.clientId}
                      onChange={(e) => {
                        handleInputChange('clientId', e.target.value)
                        // Update client name for fallback
                        const selectedClient = clients.find(c => c._id === e.target.value)
                        if (selectedClient) {
                          handleInputChange('clientName', `${selectedClient.firstName} ${selectedClient.lastName}`)
                        } else {
                          handleInputChange('clientName', '')
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="" className="bg-slate-800">Select a client or create new</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id} className="bg-slate-800">
                          {client.firstName} {client.lastName}
                          {client.company && ` (${client.company})`}
                          {client.email && ` - ${client.email}`}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {/* Fallback text input when no client is selected */}
                  {!formData.clientId && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={formData.clientName}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Or enter new client name"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        A new client will be created with this name and lead information
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Project description..."
                />
              </div>
            </div>

            {/* Project Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Project Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-slate-800">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-slate-800">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Budget & Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Budget & Timeline
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Budget
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {currencyOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-slate-800">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Notes
              </h3>
              
              <div>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this project..."
                />
              </div>
            </div>

            {/* Project Requirements */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Project Requirements
                <span className="ml-2 text-xs text-slate-400 font-normal">
                  {lead?.requirements?.scope ? '(from lead details)' : '(required for project)'}
                </span>
              </h3>
              
              {!lead?.requirements?.scope && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-sm text-yellow-400">
                    <strong>⚠️ Note:</strong> This lead doesn't have detailed requirements. Please add comprehensive project requirements below to ensure successful project planning.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Requirements *
                </label>
                <textarea
                  value={formData.requirements.scope}
                  onChange={(e) => handleInputChange('requirements.scope', e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your project requirements including scope, deliverables, technical needs, business goals, timeline expectations, and any other important details..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="mt-6 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-400">
              💡 <strong>Tip:</strong> If your project name already exists, we'll automatically append a timestamp to make it unique, or you can click "Generate Unique Name" to create one manually.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleSubmit}
              disabled={loading || !formData.name?.trim() || (!formData.clientId && !formData.clientName?.trim()) || !nameAvailable || !formData.requirements?.scope?.trim()}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <FolderPlus className="w-4 h-4" />
              )}
              <span>
                {loading ? 'Creating...' : 
                 !nameAvailable ? 'Fix Name First' : 
                 'Create Project'}
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ProjectConversionModal 