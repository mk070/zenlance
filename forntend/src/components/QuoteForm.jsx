

import { useState, useEffect } from 'react'
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const QuoteForm = ({ initialData, onSave, onCancel, saving = false }) => {
  // State for clients and projects
  const [clients, setClients] = useState([])
  const [projects, setProjects] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    clientName: '',
    clientEmail: '',
    projectId: '',
    validUntil: '',
    items: [{
      itemType: 'service',
      name: '',
      description: '',
      quantity: 1,
      unit: 'piece',
      rate: 0
    }],
    tax: 0,
    discount: 0,
    currency: 'USD',
    notes: '',
    ...initialData
  })

  // Debug log for initial data
  useEffect(() => {
    if (initialData) {
      console.log('QuoteForm initialized with data:', {
        clientId: initialData.clientId,
        projectId: initialData.projectId,
        title: initialData.title
      })
    }
  }, [initialData])

  // Separate state for calculated values (display only)
  const [calculatedAmounts, setCalculatedAmounts] = useState({
    subtotal: 0,
    taxAmount: 0,
    discountAmount: 0,
    total: 0
  })

  const itemTypes = [
    { value: 'service', label: 'Service' },
    { value: 'product', label: 'Product' },
    { value: 'hour', label: 'Hourly' },
    { value: 'fixed', label: 'Fixed Price' }
  ]

  const units = [
    { value: 'piece', label: 'Piece' },
    { value: 'hour', label: 'Hour' },
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'project', label: 'Project' }
  ]

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' }
  ]

  useEffect(() => {
    calculateTotals()
  }, [formData.items, formData.tax, formData.discount])

  useEffect(() => {
    loadClients()
    loadProjects()
  }, [])

  // Effect to handle project selection when initialData contains projectId
  useEffect(() => {
    if (initialData?.projectId && initialData?.clientId && projects.length > 0) {
      // Ensure the project is in the filtered list
      const clientProjects = projects.filter(project => {
        if (typeof project.clientId === 'string') {
          return project.clientId === initialData.clientId
        } else if (typeof project.clientId === 'object' && project.clientId?._id) {
          return project.clientId._id === initialData.clientId
        }
        return false
      })
      setFilteredProjects(clientProjects)
      
      // Verify the project exists in the filtered list
      const projectExists = clientProjects.find(p => p._id === initialData.projectId)
      if (projectExists) {
        console.log('Project found and will be selected:', projectExists.name)
      } else {
        console.warn('Project not found in filtered list for client')
      }
    }
  }, [initialData?.projectId, initialData?.clientId, projects])

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
        const projectsData = result.data.projects || []
        setProjects(projectsData)
        
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
          console.log(`Filtered ${clientProjects.length} projects for client ${formData.clientId}`)
        } else if (initialData?.clientId) {
          // Also check initialData for client selection
          const clientProjects = projectsData.filter(project => {
            if (typeof project.clientId === 'string') {
              return project.clientId === initialData.clientId
            } else if (typeof project.clientId === 'object' && project.clientId?._id) {
              return project.clientId._id === initialData.clientId
            }
            return false
          })
          setFilteredProjects(clientProjects)
          console.log(`Filtered ${clientProjects.length} projects for initial client ${initialData.clientId}`)
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (item.quantity * item.rate)
    }, 0)

    const taxAmount = (subtotal * (formData.tax || 0)) / 100
    const discountAmount = (subtotal * (formData.discount || 0)) / 100
    const total = subtotal + taxAmount - discountAmount

    setCalculatedAmounts({
      subtotal: subtotal,
      taxAmount: taxAmount,
      discountAmount: discountAmount,
      total: total
    })
  }

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
        console.log(`Filtered ${clientProjects.length} projects for client ${value}`)
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
            rate: selectedProject.budget || 0
          }]
        }))
      }
    }
  }

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        itemType: 'service',
        name: '',
        description: '',
        quantity: 1,
        unit: 'piece',
        rate: 0
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

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('Quote title is required')
      return
    }
    
    if (!formData.clientId) {
      toast.error('Client is required')
      return
    }
    
    if (!formData.projectId) {
      toast.error('Project is required')
      return
    }
    
    if (!formData.clientEmail.trim()) {
      toast.error('Client email is required')
      return
    }
    
    if (!formData.validUntil) {
      toast.error('Valid until date is required')
      return
    }

    if (formData.items.some(item => !item.name.trim() || item.rate <= 0)) {
      toast.error('All items must have a name and valid rate')
      return
    }

    // Prepare data for submission with proper Date object for validUntil
    const submissionData = {
      ...formData,
      validUntil: typeof formData.validUntil === 'string' ? new Date(formData.validUntil) : formData.validUntil,
      // Include calculated amounts for items
      items: formData.items.map(item => ({
        ...item,
        amount: item.quantity * item.rate
      })),
      // Include calculated totals
      subtotal: calculatedAmounts.subtotal,
      taxAmount: calculatedAmounts.taxAmount,
      discountAmount: calculatedAmounts.discountAmount,
      total: calculatedAmounts.total
    }
    
    onSave(submissionData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project Information (if applicable) */}
      {formData.projectId && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-medium text-blue-400 mb-2">Project Quote</h3>
          <p className="text-slate-300 text-sm">
            This quote is being created for a specific project. The quote will be linked to the project for better organization.
          </p>
        </div>
      )}

      {/* Client and Project Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-300">Client <span className="text-red-400">*</span></label>
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
            className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all"
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-slate-300">
              Project <span className="text-red-400">*</span>
              <span className="text-xs text-slate-400 ml-2">(Required)</span>
            </label>
            <button
              type="button"
              onClick={loadProjects}
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
              !formData.projectId ? 'border-red-400/50 focus:ring-red-400/50 focus:border-red-400/50' : 'border-white/10 focus:ring-blue-400/50 focus:border-blue-400/50'
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
          {!formData.projectId && (
            <p className="mt-1 text-xs text-red-400">
              ⚠️ Project selection is required for quote creation
            </p>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Quote Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            placeholder="Enter quote title"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Valid Until *</label>
          <input
            type="date"
            value={formData.validUntil}
            onChange={(e) => handleInputChange('validUntil', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            required
          />
        </div>
      </div>

      {/* Client Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Client Name</label>
          <input
            type="text"
            value={formData.clientName}
            onChange={(e) => handleInputChange('clientName', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            placeholder="Client name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Client Email *</label>
          <input
            type="email"
            value={formData.clientEmail}
            onChange={(e) => handleInputChange('clientEmail', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            placeholder="client@example.com"
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
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
          placeholder="Quote description"
        />
      </div>

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Quote Items</h3>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
                    placeholder="Item name"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
                  <select
                    value={item.itemType}
                    onChange={(e) => handleItemChange(index, 'itemType', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-400/50"
                  >
                    {itemTypes.map(type => (
                      <option key={type.value} value={type.value} className="bg-slate-800">
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Qty</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Unit</label>
                  <select
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-400/50"
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value} className="bg-slate-800">
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Rate *</label>
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="md:col-span-1">
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

              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
                  placeholder="Item description"
                />
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
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
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
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
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
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          >
            {currencies.map(currency => (
              <option key={currency.value} value={currency.value} className="bg-slate-800">
                {currency.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Total Summary */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4">Quote Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-slate-300">
            <span>Subtotal:</span>
            <span>${calculatedAmounts.subtotal.toFixed(2)} {formData.currency}</span>
          </div>
          {formData.tax > 0 && (
            <div className="flex justify-between text-slate-300">
              <span>Tax ({formData.tax}%):</span>
              <span>${calculatedAmounts.taxAmount.toFixed(2)} {formData.currency}</span>
            </div>
          )}
          {formData.discount > 0 && (
            <div className="flex justify-between text-slate-300">
              <span>Discount ({formData.discount}%):</span>
              <span>-${calculatedAmounts.discountAmount.toFixed(2)} {formData.currency}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-semibold text-white border-t border-white/10 pt-2">
            <span>Total:</span>
            <span>${calculatedAmounts.total.toFixed(2)} {formData.currency}</span>
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
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
          placeholder="Additional notes for the quote"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 font-medium"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{saving ? 'Creating...' : 'Create Quote'}</span>
        </button>
      </div>
    </form>
  )
}

export default QuoteForm 