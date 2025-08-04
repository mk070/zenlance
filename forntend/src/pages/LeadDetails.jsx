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
  UserCheck,
  FileText,
  Sparkles,
  Bot,
  TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'
import AIButton from '../components/ai/AIButton'
import AISuggestionsPanel from '../components/ai/AISuggestionsPanel'
import aiService from '../services/aiService'

const LeadDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
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
    source: '',
    status: '',
    priority: '',
    budget: {
      min: 0,
      max: 0,
      currency: 'USD'
    },
    timeline: {
      startDate: '',
      endDate: '',
      urgency: 'Flexible'
    },
    interests: [],
    tags: []
  })

  const statusOptions = [
    { value: 'New', label: 'New', color: 'text-blue-400 bg-blue-400/10' },
    { value: 'Contacted', label: 'Contacted', color: 'text-yellow-400 bg-yellow-400/10' },
    { value: 'Qualified', label: 'Qualified', color: 'text-green-400 bg-green-400/10' },
    { value: 'Proposal', label: 'Proposal Sent', color: 'text-purple-400 bg-purple-400/10' },
    { value: 'Negotiation', label: 'Negotiation', color: 'text-orange-400 bg-orange-400/10' },
    { value: 'Won', label: 'Closed Won', color: 'text-emerald-400 bg-emerald-400/10' },
    { value: 'Lost', label: 'Closed Lost', color: 'text-red-400 bg-red-400/10' }
  ]

  const priorityOptions = [
    { value: 'Low', label: 'Low', color: 'text-gray-400' },
    { value: 'Medium', label: 'Medium', color: 'text-yellow-400' },
    { value: 'High', label: 'High', color: 'text-orange-400' },
    { value: 'Urgent', label: 'Urgent', color: 'text-red-400' }
  ]

  // Load lead data
  useEffect(() => {
    const loadLead = async () => {
      try {
        setLoading(true)
        const result = await apiClient.getLead(id)
        
        if (result.success) {
          setLead(result.data.lead)
          setFormData({
            firstName: result.data.lead.firstName || '',
            lastName: result.data.lead.lastName || '',
            email: result.data.lead.email || '',
            phone: result.data.lead.phone || '',
            company: result.data.lead.company || '',
            jobTitle: result.data.lead.jobTitle || '',
            industry: result.data.lead.industry || '',
            website: result.data.lead.website || '',
            source: result.data.lead.source || '',
            status: result.data.lead.status || 'new',
            priority: result.data.lead.priority || 'medium',
            budget: result.data.lead.budget || { min: 0, max: 0, currency: 'USD' },
            timeline: result.data.lead.timeline || { startDate: '', endDate: '', urgency: 'medium' },
            interests: result.data.lead.interests || [],
            tags: result.data.lead.tags || []
          })
        } else {
          toast.error('Failed to load lead details')
          navigate('/leads')
        }
      } catch (error) {
        console.error('Error loading lead:', error)
        toast.error('Failed to load lead details')
        navigate('/leads')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadLead()
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
      const result = await apiClient.updateLead(id, formData)
      
      if (result.success) {
        setLead(result.data.lead)
        setIsEditing(false)
        toast.success('Lead updated successfully!')
      } else {
        toast.error(result.error || 'Failed to update lead')
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      
      // Handle validation errors specifically
      let errorMessage = 'Failed to update lead'
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

  const handleAddNote = async () => {
    if (!noteText.trim()) return

    try {
      const result = await apiClient.addLeadNote(id, {
        content: noteText.trim(),
        type: 'general'
      })

      if (result.success) {
        setLead(prev => ({
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

  const handleConvertToClient = async () => {
    if (!window.confirm('Are you sure you want to convert this lead to a client?')) {
      return
    }

    try {
      setSaving(true)
      const result = await apiClient.convertLeadToClient(id)
      
      if (result.success) {
        toast.success('Lead converted to client successfully!')
        navigate('/clients')
      } else {
        toast.error(result.error || 'Failed to convert lead')
      }
    } catch (error) {
      console.error('Error converting lead:', error)
      toast.error('Failed to convert lead')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateProposal = async () => {
    try {
      setSaving(true)
      
      // First, update lead status to "Proposal" if not already
      if (lead.status !== 'Proposal') {
        await apiClient.updateLead(id, { status: 'Proposal' })
        setLead(prev => ({ ...prev, status: 'Proposal' }))
      }

      // Check if lead is already converted to client
      if (lead.convertedToClient && lead.clientId) {
        // Navigate directly to create quote for existing client
        navigate(`/quotes?client=${lead.clientId}&source=lead&leadId=${id}`)
      } else {
        // Convert lead to client first, then create proposal
        const convertResult = await apiClient.convertLeadToClient(id)
        
        if (convertResult.success) {
          // Navigate to create quote for the new client
          navigate(`/quotes?client=${convertResult.data.client._id}&source=lead&leadId=${id}`)
          toast.success('Lead converted to client and ready for proposal!')
        } else {
          toast.error(convertResult.error || 'Failed to convert lead to client')
        }
      }
    } catch (error) {
      console.error('Error creating proposal:', error)
      toast.error('Failed to create proposal')
    } finally {
      setSaving(false)
    }
  }

  const handleAIEnrichLead = async () => {
    try {
      const result = await aiService.enrichLeadData(id)
      if (result.success && result.data.enrichedData) {
        const enrichedData = result.data.enrichedData
        
        // Update form data with enriched information
        setFormData(prev => ({
          ...prev,
          industry: enrichedData.industry || prev.industry,
          budget: {
            ...prev.budget,
            min: enrichedData.budgetRange?.min || prev.budget.min,
            max: enrichedData.budgetRange?.max || prev.budget.max
          }
        }))
        
        toast.success('Lead data enriched with AI insights!')
      }
    } catch (error) {
      console.error('AI enrichment error:', error)
    }
  }

  const handleAIFollowUp = async () => {
    try {
      const context = {
        lastContactDate: lead.lastContactDate,
        daysSinceContact: lead.daysSinceLastContact,
        reason: 'follow_up'
      }
      
      const result = await aiService.generateFollowUpEmail(id, context)
      if (result.success) {
        // You could open an email composer or show the generated email
        toast.success('AI follow-up email generated!')
        
        // For now, we'll just show the email in console or could add to notes
        console.log('Generated email:', result.data.email)
      }
    } catch (error) {
      console.error('AI follow-up error:', error)
    }
  }

  const handleAISuggestionClick = (suggestion) => {
    // Handle different types of AI suggestions
    switch (suggestion.type) {
      case 'email':
        handleAIFollowUp()
        break
      case 'call':
        toast.info(`Suggestion: ${suggestion.title}`)
        break
      case 'meeting':
        toast.info(`Suggestion: ${suggestion.title}`)
        break
      case 'proposal':
        handleCreateProposal()
        break
      default:
        toast.info(`Suggestion: ${suggestion.title}`)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      const result = await apiClient.deleteLead(id)
      
      if (result.success) {
        toast.success('Lead deleted successfully!')
        navigate('/leads')
      } else {
        toast.error(result.error || 'Failed to delete lead')
      }
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Failed to delete lead')
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
          <p className="text-slate-400">Loading lead details...</p>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Lead not found</h3>
          <p className="text-slate-400 mb-6">The lead you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/leads')}
            className="px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all duration-200"
          >
            Back to Leads
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
              onClick={() => navigate('/leads')}
              className="hover:text-white transition-colors"
            >
              Leads
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{lead.firstName} {lead.lastName}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/leads')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-blue-500/20">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              
              <div>
                <h1 className="text-3xl font-light text-white mb-1">
                  {lead.firstName} {lead.lastName}
                </h1>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                    {statusOptions.find(opt => opt.value === lead.status)?.label || lead.status}
                  </span>
                  <span className={`text-sm ${getPriorityColor(lead.priority)}`}>
                    {priorityOptions.find(opt => opt.value === lead.priority)?.label || lead.priority} Priority
                  </span>
                  {lead.leadScore && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-white">{lead.leadScore}/100</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* AI-powered buttons */}
              <AIButton
                onClick={handleAIEnrichLead}
                icon={TrendingUp}
                size="sm"
                variant="secondary"
              >
                AI Enrich
              </AIButton>
              
              <AIButton
                onClick={handleAIFollowUp}
                icon={Bot}
                size="sm"
                variant="secondary"
              >
                AI Follow-up
              </AIButton>
              
              {lead.status !== 'Won' && lead.status !== 'Lost' && (
                <motion.button
                  onClick={handleCreateProposal}
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-all duration-200 disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>Create Proposal</span>
                </motion.button>
              )}
              
              {lead.status !== 'Won' && (
                <motion.button
                  onClick={handleConvertToClient}
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 transition-all duration-200 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Convert to Client</span>
                </motion.button>
              )}
              
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
                    <p className="text-white">{lead.firstName || '-'}</p>
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
                    <p className="text-white">{lead.lastName || '-'}</p>
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
                      <a href={`mailto:${lead.email}`} className="text-blue-400 hover:text-blue-300">
                        {lead.email || '-'}
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
                      <a href={`tel:${lead.phone}`} className="text-blue-400 hover:text-blue-300">
                        {lead.phone || '-'}
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
                    <p className="text-white">{lead.company || '-'}</p>
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
                    <p className="text-white">{lead.jobTitle || '-'}</p>
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
                    <p className="text-white">{lead.industry || '-'}</p>
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
                      {lead.website ? (
                        <a 
                          href={lead.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {lead.website}
                        </a>
                      ) : (
                        <span className="text-white">-</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Project Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Budget Range</label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={formData.budget.min}
                        onChange={(e) => handleInputChange('budget.min', parseInt(e.target.value) || 0)}
                        placeholder="Min"
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="number"
                        value={formData.budget.max}
                        onChange={(e) => handleInputChange('budget.max', parseInt(e.target.value) || 0)}
                        placeholder="Max"
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span className="text-white">
                        {lead.budget?.min && lead.budget?.max 
                          ? `$${lead.budget.min.toLocaleString()} - $${lead.budget.max.toLocaleString()}`
                          : '-'
                        }
                      </span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Timeline</label>
                  {isEditing ? (
                    <select
                      value={formData.timeline.urgency}
                      onChange={(e) => handleInputChange('timeline.urgency', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      <option value="low">Flexible (3+ months)</option>
                      <option value="medium">Moderate (1-3 months)</option>
                      <option value="high">Urgent (&lt; 1 month)</option>
                      <option value="immediate">Immediate (ASAP)</option>
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-white">
                        {lead.timeline?.urgency ? 
                          lead.timeline.urgency.charAt(0).toUpperCase() + lead.timeline.urgency.slice(1)
                          : '-'
                        }
                      </span>
                    </div>
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
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                      {statusOptions.find(opt => opt.value === lead.status)?.label || lead.status}
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
                    <span className={`text-sm font-medium ${getPriorityColor(lead.priority)}`}>
                      {priorityOptions.find(opt => opt.value === lead.priority)?.label || lead.priority}
                    </span>
                  )}
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
                {lead.notes && lead.notes.length > 0 ? (
                  lead.notes.map((note, index) => (
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
                  onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                  disabled={!lead.email}
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Email</span>
                </button>
                
                <button
                  onClick={() => window.open(`tel:${lead.phone}`, '_blank')}
                  disabled={!lead.phone}
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call</span>
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all duration-200 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Lead</span>
                </button>
              </div>
            </div>

            {/* AI Suggestions Panel */}
            <AISuggestionsPanel
              entityType="lead"
              entityId={id}
              onActionClick={handleAISuggestionClick}
              className="mt-6"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeadDetails 