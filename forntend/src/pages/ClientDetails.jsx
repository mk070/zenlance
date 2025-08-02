import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  ChevronRight,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Target,
  Star,
  MessageCircle,
  Plus,
  Edit3,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Briefcase,
  TrendingUp,
  FileText,
  CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const ClientDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteText, setNoteText] = useState('')
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    industry: '',
    website: '',
    status: '',
    priority: '',
    totalValue: 0,
    location: {
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    businessInfo: {
      companySize: '',
      annualRevenue: '',
      industry: ''
    }
  })

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'text-green-400 bg-green-400/10' },
    { value: 'inactive', label: 'Inactive', color: 'text-gray-400 bg-gray-400/10' },
    { value: 'potential', label: 'Potential', color: 'text-blue-400 bg-blue-400/10' },
    { value: 'onboarding', label: 'Onboarding', color: 'text-yellow-400 bg-yellow-400/10' },
    { value: 'churned', label: 'Churned', color: 'text-red-400 bg-red-400/10' }
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-gray-400' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { value: 'high', label: 'High', color: 'text-orange-400' },
    { value: 'critical', label: 'Critical', color: 'text-red-400' }
  ]

  // Load client data
  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true)
        const result = await apiClient.getClient(id)
        
        if (result.success) {
          setClient(result.data.client)
          setFormData({
            firstName: result.data.client.firstName || '',
            lastName: result.data.client.lastName || '',
            email: result.data.client.email || '',
            phone: result.data.client.phone || '',
            company: result.data.client.company || '',
            jobTitle: result.data.client.jobTitle || '',
            industry: result.data.client.industry || '',
            website: result.data.client.website || '',
            status: result.data.client.status || 'active',
            priority: result.data.client.priority || 'medium',
            totalValue: result.data.client.totalValue || 0,
            location: {
              address: result.data.client.location?.address || '',
              city: result.data.client.location?.city || '',
              state: result.data.client.location?.state || '',
              country: result.data.client.location?.country || '',
              zipCode: result.data.client.location?.zipCode || ''
            },
            businessInfo: {
              companySize: result.data.client.businessInfo?.companySize || '',
              annualRevenue: result.data.client.businessInfo?.annualRevenue || '',
              industry: result.data.client.businessInfo?.industry || ''
            }
          })
        } else {
          toast.error('Failed to load client details')
          navigate('/clients')
        }
      } catch (error) {
        console.error('Error loading client:', error)
        toast.error('Failed to load client details')
        navigate('/clients')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadClient()
    }
  }, [id, navigate])

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

  const handleSave = async () => {
    try {
      setSaving(true)
      const result = await apiClient.updateClient(id, formData)
      
      if (result.success) {
        setClient(result.data.client)
        setIsEditing(false)
        toast.success('Client updated successfully!')
      } else {
        toast.error(result.error || 'Failed to update client')
      }
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error('Failed to update client')
    } finally {
      setSaving(false)
    }
  }

  const handleAddNote = async () => {
    if (!noteText.trim()) return

    try {
      const result = await apiClient.addClientNote(id, {
        content: noteText.trim(),
        type: 'general'
      })

      if (result.success) {
        setClient(prev => ({
          ...prev,
          notes: [...(prev.notes || []), result.data.note]
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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      const result = await apiClient.deleteClient(id)
      
      if (result.success) {
        toast.success('Client deleted successfully!')
        navigate('/clients')
      } else {
        toast.error(result.error || 'Failed to delete client')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Failed to delete client')
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading client details...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Client not found</h3>
          <p className="text-slate-400 mb-6">The client you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/clients')}
            className="px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all duration-200"
          >
            Back to Clients
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
              onClick={() => navigate('/clients')}
              className="hover:text-white transition-colors"
            >
              Clients
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{client.firstName} {client.lastName}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/clients')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-emerald-500/20">
                <User className="w-6 h-6 text-emerald-400" />
              </div>
              
              <div>
                <h1 className="text-3xl font-light text-white mb-1">
                  {client.firstName} {client.lastName}
                </h1>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status)}`}>
                    {statusOptions.find(opt => opt.value === client.status)?.label || client.status}
                  </span>
                  <span className={`text-sm ${getPriorityColor(client.priority)}`}>
                    {priorityOptions.find(opt => opt.value === client.priority)?.label || client.priority} Priority
                  </span>
                  {client.totalValue && (
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">${client.totalValue.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isEditing ? (
                <motion.button
                  onClick={() => setIsEditing(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </motion.button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleSave}
                    disabled={saving}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all duration-200 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <p className="text-white">{client.firstName || '-'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <p className="text-white">{client.lastName || '-'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <a href={`mailto:${client.email}`} className="text-blue-400 hover:text-blue-300">
                        {client.email || '-'}
                      </a>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <a href={`tel:${client.phone}`} className="text-blue-400 hover:text-blue-300">
                        {client.phone || '-'}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Business Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Company</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <p className="text-white">{client.company || '-'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Job Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <p className="text-white">{client.jobTitle || '-'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Industry</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <p className="text-white">{client.industry || '-'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      {client.website ? (
                        <a 
                          href={client.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {client.website}
                        </a>
                      ) : (
                        <span className="text-white">-</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location.address}
                      onChange={(e) => handleInputChange('location.address', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <p className="text-white">{client.location?.address || '-'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) => handleInputChange('location.city', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <p className="text-white">{client.location?.city || '-'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Country</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location.country}
                      onChange={(e) => handleInputChange('location.country', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <p className="text-white">{client.location?.country || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status & Priority */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">Status & Priority</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-gray-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status)}`}>
                      {statusOptions.find(opt => opt.value === client.status)?.label || client.status}
                    </span>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                  {isEditing ? (
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-gray-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`text-sm font-medium ${getPriorityColor(client.priority)}`}>
                      {priorityOptions.find(opt => opt.value === client.priority)?.label || client.priority}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Financial Overview
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Value</span>
                  <span className="text-white font-medium">
                    ${client.totalValue ? client.totalValue.toLocaleString() : '0'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Projects</span>
                  <span className="text-white font-medium">
                    {client.projects?.length || 0}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Last Invoice</span>
                  <span className="text-slate-400 text-sm">
                    {client.lastInvoiceDate ? new Date(client.lastInvoiceDate).toLocaleDateString() : 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes & Activity */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Notes & Activity</h3>
                <button
                  onClick={() => setShowNoteForm(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {showNoteForm && (
                <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none mb-3"
                  />
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowNoteForm(false)
                        setNoteText('')
                      }}
                      className="px-3 py-1 text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNote}
                      disabled={!noteText.trim()}
                      className="px-3 py-1 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {client.notes && client.notes.length > 0 ? (
                  client.notes.map((note, index) => (
                    <div key={index} className="p-3 bg-white/5 border border-white/10 rounded-lg">
                      <p className="text-white text-sm mb-1">{note.content}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm">No notes yet</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.open(`mailto:${client.email}`, '_blank')}
                  disabled={!client.email}
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Email</span>
                </button>
                
                <button
                  onClick={() => window.open(`tel:${client.phone}`, '_blank')}
                  disabled={!client.phone}
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </button>
                
                <button
                  onClick={() => navigate(`/invoices/new?client=${id}`)}
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-all duration-200"
                >
                  <FileText className="w-4 h-4" />
                  <span>Create Invoice</span>
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all duration-200 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Client</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClientDetails 