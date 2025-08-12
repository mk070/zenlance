import { useState, useEffect, useCallback } from 'react'
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
  Wand2,
  Eye,
  Download,
  Send,
  FolderPlus,
   Sparkles,
  Bot,
  TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'
import ProposalModal from '../components/ProposalModal'
import ProjectConversionModal from '../components/ProjectConversionModal'
import QuoteForm from '../components/QuoteForm'
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
  
  // Proposal state
  const [proposals, setProposals] = useState([])
  const [showProposalModal, setShowProposalModal] = useState(false)
  const [loadingProposals, setLoadingProposals] = useState(false)
  const [sendingProposal, setSendingProposal] = useState(null) // Track which proposal is being sent

  // Project conversion state
  const [showProjectModal, setShowProjectModal] = useState(false)
  
  // Quote creation state
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [quoteFormData, setQuoteFormData] = useState(null)
  const [creatingQuote, setCreatingQuote] = useState(false)
  
  // AI modals state
  const [showAIEnrichModal, setShowAIEnrichModal] = useState(false)
  const [showAIFollowUpModal, setShowAIFollowUpModal] = useState(false)
  const [aiEnrichData, setAIEnrichData] = useState(null)
  const [aiFollowUpData, setAIFollowUpData] = useState(null)

  // Define loadProposals function that can be reused
  const loadProposals = useCallback(async () => {
    if (!id) return
    
    try {
      setLoadingProposals(true)
      const result = await apiClient.getLeadProposals(id)
      if (result.success) {
        setProposals(result.data.proposals || [])
      }
    } catch (error) {
      console.error('Error loading proposals:', error)
    } finally {
      setLoadingProposals(false)
    }
  }, [id])

  // Load proposals for this lead
  useEffect(() => {
    if (id) {
      loadProposals()
    }
  }, [id, loadProposals])

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
    requirements: {
      scope: ''
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
            requirements: result.data.lead.requirements || { scope: '' },
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

  // Proposal handling functions
  const handleGenerateProposal = async () => {
    if (!lead) return;
    
    // Show the modal instead of directly generating
    setShowProposalModal(true);
  }

  const handleProposalGenerated = async (proposal) => {
    // Add the new proposal to the list
    setProposals(prev => [proposal, ...prev])
    
    // Close the modal
    setShowProposalModal(false)
    
    // Update lead budget from proposal investment amount
    if (proposal.content?.investment?.totalAmount) {
      try {
        const updatedBudget = {
          min: proposal.content.investment.totalAmount,
          max: proposal.content.investment.totalAmount,
          currency: proposal.content.investment.currency || 'USD'
        }
        
        const updateResult = await apiClient.updateLead(id, { budget: updatedBudget })
        if (updateResult.success) {
          setLead(prev => ({ ...prev, budget: updatedBudget }))
          setFormData(prev => ({ ...prev, budget: updatedBudget }))
          toast.success('Lead budget updated from proposal')
        }
      } catch (error) {
        console.error('Error updating lead budget:', error)
        // Don't show error toast as this is not critical
      }
    }
    
    // Reload proposals to ensure we have the latest data
    await loadProposals()
  }

  // Quote creation is now handled in the Quotes page after project creation

  const handleSaveQuote = async (formData) => {
    try {
      setCreatingQuote(true)
      
      // Find or create client
      let clientId = formData.clientId
      
      if (!clientId && formData.clientEmail) {
        // Try to find existing client by email
        const clientsResult = await apiClient.getClients({ search: formData.clientEmail, limit: 1 })
        if (clientsResult.success && clientsResult.data.clients?.length > 0) {
          clientId = clientsResult.data.clients[0]._id
        } else {
          // Create client from form data
          const clientData = {
            firstName: lead.firstName || formData.clientName?.split(' ')[0] || 'Unknown',
            lastName: lead.lastName || formData.clientName?.split(' ').slice(1).join(' ') || '',
            email: formData.clientEmail,
            phone: lead.phone || '',
            company: lead.company || 'Unknown Company',
            jobTitle: lead.jobTitle || '',
            industry: lead.industry || 'Other',
            acquisitionSource: 'Converted Lead',
            status: 'Active',
            type: 'Individual',
            priority: lead.priority || 'Medium'
          }
          
          const clientResult = await apiClient.createClient(clientData)
          if (clientResult.success) {
            clientId = clientResult.data._id
          } else {
            throw new Error('Failed to create client')
          }
        }
      }
      
      if (!clientId) {
        throw new Error('Client is required to create a quote')
      }
      
      const quoteData = {
        title: formData.title,
        description: formData.description,
        clientId: clientId,
        validUntil: new Date(formData.validUntil),
        items: formData.items.map(item => ({
          itemType: item.itemType,
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.quantity * item.rate
        })),
        tax: formData.tax || 0,
        discount: formData.discount || 0,
        currency: formData.currency || 'USD',
        notes: formData.notes || '',
        proposalId: formData.proposalId,
        projectId: formData.projectId, // Add project ID if available
        subtotal: formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0),
        total: (() => {
          const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
          const taxAmount = (subtotal * (formData.tax || 0)) / 100
          const discountAmount = (subtotal * (formData.discount || 0)) / 100
          return subtotal + taxAmount - discountAmount
        })()
      }
      
      console.log('Sending quote data:', JSON.stringify(quoteData, null, 2))
      const result = await apiClient.createQuote(quoteData)
      
      if (result.success) {
        const message = formData.projectId 
          ? 'Quote created successfully for the project!' 
          : 'Quote created successfully!'
        toast.success(message)
        setShowQuoteModal(false)
        setQuoteFormData(null)
      } else {
        throw new Error(result.error || 'Failed to create quote')
      }
      
    } catch (error) {
      console.error('Error creating quote:', error)
      toast.error(error.message || 'Failed to create quote')
    } finally {
      setCreatingQuote(false)
    }
  }

  const handleProposalModalClose = () => {
    setShowProposalModal(false)
  }

  const handleViewProposal = async (proposalId) => {
    try {
      await apiClient.viewProposal(proposalId);
    } catch (error) {
      console.error('Error viewing proposal:', error);
      toast.error('Failed to view proposal');
    }
  }

  const handleDownloadProposal = async (proposal) => {
    try {
      console.log('🔍 Downloading proposal:', proposal._id);
      const blob = await apiClient.downloadProposal(proposal._id);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${proposal.title || 'proposal'}-${proposal.proposalNumber}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Proposal downloaded successfully');
      toast.success('Proposal downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading proposal:', error);
      toast.error('Failed to download proposal');
    }
  }

  const handleSendProposal = async (proposal) => {
    try {
      setSendingProposal(proposal._id) // Set loading state for this specific proposal
      const result = await apiClient.sendProposal(proposal._id, {
        subject: `Proposal from freelancehub - ${proposal.title}`,
        message: `Dear ${lead?.firstName},\n\nI'm pleased to share a comprehensive proposal for your project.\n\nPlease review the attached proposal and feel free to reach out with any questions.\n\nBest regards,\nfreelancehub Team`
      })

      if (result.success) {
        toast.success('Proposal sent successfully!')
        // Update the proposal status in the list
        setProposals(prev => 
          prev.map(p => 
            p._id === proposal._id 
              ? { ...p, status: 'sent', sentDate: new Date() }
              : p
          )
        )
      } else {
        toast.error(result.error || 'Failed to send proposal')
      }
    } catch (error) {
      console.error('Error sending proposal:', error)
      toast.error('Failed to send proposal')
    } finally {
      setSendingProposal(null) // Clear loading state
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
    if (!window.confirm('Are you sure you want to convert this lead to a client and create a project?')) {
      return
    }

    try {
      setSaving(true)
      let clientId = null
      
      // Check if lead is already converted first
      if (lead.convertedToClient) {
        toast('This lead has already been converted to a client. You can create a project for them.', { icon: 'ℹ️' })
        setShowProjectModal(true)
        return
      }
      
      // First try to convert lead to client
      try {
        const result = await apiClient.convertLeadToClient(id)
        
        if (result.success) {
          toast.success('Lead converted to client successfully!')
          clientId = result.data.client._id
          
          // Update lead state immediately
          setLead(prev => ({ 
            ...prev, 
            convertedToClient: true,
            status: 'Converted'
          }))
        }
      } catch (conversionError) {
        console.log('Conversion error:', conversionError)
        
        // Check if the error is because client already exists
        if (conversionError.message && conversionError.message.includes('client with this email already exists')) {
          // Client already exists - just show project modal for manual creation
          toast('Client with this email already exists. Please create the project manually.', { icon: 'ℹ️' })
          setShowProjectModal(true)
          
          // Update lead status to reflect it's converted
          setLead(prev => ({ 
            ...prev, 
            convertedToClient: true,
            status: 'Converted'
          }))
          return
        } else if (conversionError.message && conversionError.message.includes('Lead has already been converted to client')) {
          // Lead already converted - show project modal and update lead status
          toast('This lead has already been converted to a client. You can create a project for them.', { icon: 'ℹ️' })
          setShowProjectModal(true)
          
          // Update lead status to reflect it's already converted
          setLead(prev => ({ 
            ...prev, 
            convertedToClient: true,
            status: 'Converted'
          }))
          return
        } else {
          // Other conversion errors
          throw conversionError
        }
      }

      // Always show the project modal for user to complete project creation
      // This prevents duplicate project creation and ensures user can review/edit details
      if (clientId) {
        console.log('✅ Client ID available for project creation:', clientId)
        toast('Client converted successfully! Please complete the project details.', { icon: '✅' })
        setShowProjectModal(true)
      } else {
        console.warn('❌ No client ID available for project creation')
        toast('Unable to get client information. Please create the project manually.', { icon: '⚠️' })
        setShowProjectModal(true)
      }
    } catch (error) {
      console.error('Error in convert to client process:', error)
      
      // Provide more specific error messages
      if (error.message && error.message.includes('Validation error')) {
        toast.error(`Validation error: ${error.message}`)
      } else if (error.message && error.message.includes('priority')) {
        toast.error('Invalid priority value. Please create the project manually.')
        setShowProjectModal(true)
      } else {
        toast.error('Failed to convert lead. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleConvertToProject = () => {
    console.log('🎯 Opening project conversion modal')
    setShowProjectModal(true)
  }

  const handleProjectCreated = async (project) => {
    console.log('🎉 Project created successfully:', project)
    console.log('Project clientId type:', typeof project?.clientId, 'Value:', project?.clientId)
    
    // Close the project modal
    setShowProjectModal(false)
    
    try {
      // Update lead status to indicate it has been converted to project
      await apiClient.updateLead(id, { 
        status: 'Won',
        convertedToProject: true,
        projectId: project._id
      })
      setLead(prev => ({ 
        ...prev, 
        status: 'Won',
        convertedToProject: true,
        projectId: project._id
      }))
    } catch (error) {
      console.error('Error updating lead status:', error)
    }
    
    // Navigate to Quotes page to create quote for the project
    if (project && project._id) {
      toast.success('Project created successfully!')
      
      // Extract proper client ID
      let clientIdForQuote = null
      if (project.clientId) {
        if (typeof project.clientId === 'object' && project.clientId._id) {
          clientIdForQuote = project.clientId._id
        } else if (typeof project.clientId === 'string') {
          clientIdForQuote = project.clientId
        }
      }
      
      if (clientIdForQuote) {
        navigate(`/quotes?project=${project._id}&client=${clientIdForQuote}&source=project&leadId=${id}`)
      } else {
        console.warn('No valid clientId found in project:', project)
        navigate(`/quotes?project=${project._id}&source=project&leadId=${id}`)
      }
    } else {
      toast.success('Project created successfully!')
      navigate('/quotes')
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
      // Generate mock AI enrichment data
      const mockEnrichData = {
        industry: lead.industry || 'Technology',
        companySize: '50-200 employees',
        budget: {
          min: lead.budget?.min || 10000,
          max: lead.budget?.max || 50000,
          currency: lead.budget?.currency || 'USD'
        },
        timeline: {
          startDate: lead.timeline?.startDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: lead.timeline?.endDate || new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          urgency: lead.timeline?.urgency || 'medium'
        },
        insights: [
          'Company is actively expanding their digital presence',
          'Recent funding round suggests healthy budget for new projects',
          'Industry trend shows 23% growth in similar service demands',
          'Decision maker appears to be actively evaluating solutions'
        ],
        recommendations: [
          'Emphasize ROI and scalability in your proposal',
          'Highlight relevant case studies from similar companies',
          'Consider offering a pilot project to reduce perceived risk',
          'Follow up within 3-5 days for optimal engagement'
        ]
      }
      
      setAIEnrichData(mockEnrichData)
      setShowAIEnrichModal(true)
    } catch (error) {
      console.error('AI enrichment error:', error)
      toast.error('Failed to generate AI insights')
    }
  }

  const handleAIFollowUp = async () => {
    try {
      // Generate mock AI follow-up email
      const mockFollowUpData = {
        subject: `Following up on our conversation - ${lead.company}`,
        email: `Hi ${lead.firstName},

I hope this email finds you well. I wanted to follow up on our recent conversation about ${lead.description || 'your project requirements'}.

Based on our discussion, I believe we can help ${lead.company} achieve significant results with our ${lead.projectType || 'services'}. Here are a few key points that might interest you:

• Our approach typically delivers ROI within the first 3-6 months
• We've helped similar companies in the ${lead.industry || 'technology'} sector reduce costs by 25-40%
• Our team brings over 10 years of experience in ${lead.projectType || 'digital solutions'}

I'd love to schedule a brief 15-minute call to discuss how we can specifically help ${lead.company}. Are you available for a quick chat this week?

Looking forward to hearing from you.

Best regards,
[Your Name]`,
        nextSteps: [
          'Send this email within the next 24 hours',
          'Schedule a follow-up call for next week',
          'Prepare a brief case study relevant to their industry',
          'Consider sending a proposal draft if they respond positively'
        ],
        timing: 'Best to send: Tuesday-Thursday, 10 AM - 2 PM',
        tone: 'Professional and consultative'
      }
      
      setAIFollowUpData(mockFollowUpData)
      setShowAIFollowUpModal(true)
    } catch (error) {
      console.error('AI follow-up error:', error)
      toast.error('Failed to generate follow-up email')
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
                    {lead.convertedToProject ? 'Converted to Project' : (statusOptions.find(opt => opt.value === lead.status)?.label || lead.status)}
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

              {/* AI-powered buttons - only show if not fully converted to project */}
              {!lead.convertedToProject && (
                <>
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
                </>
              )}
              
              {/* Only show proposal creation if not converted to project and no proposals exist */}
              {!lead.convertedToProject && lead.status !== 'Won' && lead.status !== 'Lost' && proposals.length === 0 && (
                <motion.button
                  onClick={handleGenerateProposal}
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-all duration-200 disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>Create Proposal</span>
                </motion.button>
              )}
              
              {/* Single Convert button - only show if not converted at all */}
              {!lead.convertedToProject && !lead.convertedToClient && lead.status !== 'Won' && lead.status !== 'Lost' && (
                <motion.button
                  onClick={handleConvertToClient}
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 transition-all duration-200 disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Convert to Client & Project</span>
                </motion.button>
              )}

              {/* Clean final state - only show project link once fully converted */}
              {lead.convertedToProject && lead.projectId && (
                <motion.button
                  onClick={() => navigate(`/projects/${lead.projectId}`)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all duration-200"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Project</span>
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
                    <p className="text-white">{lead.email || '-'}</p>
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
                    <p className="text-white">{lead.phone || '-'}</p>
                  )}
                </div>

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
                    <p className="text-white">{lead.website || '-'}</p>
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">Project Description</label>
                  {isEditing ? (
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <p className="text-white">{lead.description || '-'}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Project Requirements</label>
                  {isEditing ? (
                    <textarea
                      value={formData.requirements?.scope || ''}
                      onChange={(e) => handleInputChange('requirements.scope', e.target.value)}
                      rows={4}
                      placeholder="Describe your project requirements including scope, deliverables, technical needs, business goals, timeline expectations, and any other important details..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      {lead.requirements?.scope ? (
                        <p className="text-white whitespace-pre-wrap">{lead.requirements.scope}</p>
                      ) : (
                        <p className="text-slate-400 italic">No requirements specified</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Budget Range</label>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <input
                          type="number"
                          placeholder="Min"
                          value={formData.budget.min}
                          onChange={(e) => handleInputChange('budget.min', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={formData.budget.max}
                          onChange={(e) => handleInputChange('budget.max', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                      </>
                    ) : (
                      <p className="text-white">
                        {lead.budget?.min || lead.budget?.max 
                          ? `$${lead.budget?.min?.toLocaleString() || '0'} - $${lead.budget?.max?.toLocaleString() || '0'} ${lead.budget?.currency || 'USD'}`
                          : '-'
                        }
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Timeline</label>
                  <div className="space-y-2">
                    {isEditing ? (
                      <>
                        <input
                          type="date"
                          placeholder="Start Date"
                          value={formData.timeline.startDate}
                          onChange={(e) => handleInputChange('timeline.startDate', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                        <input
                          type="date"
                          placeholder="End Date"
                          value={formData.timeline.endDate}
                          onChange={(e) => handleInputChange('timeline.endDate', e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                        />
                      </>
                    ) : (
                      <div>
                        <p className="text-white text-sm">
                          Start: {lead.timeline?.startDate ? new Date(lead.timeline.startDate).toLocaleDateString() : 'Not set'}
                        </p>
                        <p className="text-white text-sm">
                          End: {lead.timeline?.endDate ? new Date(lead.timeline.endDate).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                  {isEditing ? (
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      <option value="">Select Priority</option>
                      {priorityOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-slate-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      lead.priority === 'high' ? 'bg-red-100 text-red-800' :
                      lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      lead.priority === 'low' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.priority?.charAt(0).toUpperCase() + lead.priority?.slice(1) || 'Not set'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status & Source */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Status & Source
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      <option value="">Select Status</option>
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-slate-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                      lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'proposal' ? 'bg-purple-100 text-purple-800' :
                      lead.status === 'negotiation' ? 'bg-yellow-100 text-yellow-800' :
                      lead.status === 'won' ? 'bg-green-100 text-green-800' :
                      lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1) || 'Not set'}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Source</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => handleInputChange('source', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  ) : (
                    <p className="text-white">{lead.source || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Quick Actions</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-1 px-3 py-1 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-all text-sm"
                >
                  {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  <span>{isEditing ? 'Save' : 'Edit'}</span>
                </button>
              </div>
              
              {isEditing && (
                <div className="space-y-3 mb-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/30 transition-all duration-200 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Changes</span>
                  </button>
                  
                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-full flex items-center space-x-2 px-4 py-2 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Notes
                </h3>
                <button
                  onClick={() => setShowNoteForm(!showNoteForm)}
                  className="flex items-center space-x-1 px-3 py-1 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              
              {showNoteForm && (
                <div className="mb-4 space-y-3">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddNote}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all text-sm"
                    >
                      <Save className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowNoteForm(false)
                        setNoteText('')
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-white/10 text-slate-300 rounded-lg hover:bg-white/20 transition-all text-sm"
                    >
                      <X className="w-3 h-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="space-y-3 max-h-48 overflow-y-auto">
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

            {/* Compact Proposals Section */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-md font-medium text-white flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Proposals
                </h3>
              </div>
              
              {loadingProposals ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              ) : proposals.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {proposals.map((proposal) => (
                    <div key={proposal._id} className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white text-sm truncate">{proposal.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                            <span>#{proposal.proposalNumber}</span>
                            {proposal.content?.investment?.totalAmount && (
                              <span className="text-green-400 font-medium">
                                ${proposal.content.investment.totalAmount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          proposal.status === 'generated' ? 'bg-blue-400/20 text-blue-400' :
                          proposal.status === 'sent' ? 'bg-emerald-400/20 text-emerald-400' :
                          proposal.status === 'viewed' ? 'bg-yellow-400/20 text-yellow-400' :
                          proposal.status === 'accepted' ? 'bg-green-400/20 text-green-400' :
                          proposal.status === 'rejected' ? 'bg-red-400/20 text-red-400' :
                          'bg-slate-400/20 text-slate-400'
                        }`}>
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </span>
                      </div>
                      
                      {/* Compact Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleViewProposal(proposal._id)}
                          className="flex items-center space-x-1 px-2 py-1 bg-white/10 text-slate-300 rounded text-xs hover:bg-white/20 transition-all flex-1 justify-center"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        
                        <button
                          onClick={() => handleDownloadProposal(proposal)}
                          className="flex items-center space-x-1 px-2 py-1 bg-white/10 text-slate-300 rounded text-xs hover:bg-white/20 transition-all flex-1 justify-center"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                        
                        {proposal.status === 'generated' && (
                          <button
                            onClick={() => handleSendProposal(proposal)}
                            disabled={sendingProposal === proposal._id}
                            className="flex items-center space-x-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs hover:bg-emerald-500/30 transition-all disabled:opacity-50 flex-1 justify-center"
                          >
                            {sendingProposal === proposal._id ? (
                              <div className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Send className="w-3 h-3" />
                                <span>Send</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {proposal.status === 'sent' && proposal.sentDate && (
                        <div className="flex items-center justify-center space-x-1 text-xs text-slate-400 mt-2">
                          <CheckCircle className="w-3 h-3" />
                          <span>Sent {new Date(proposal.sentDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs mb-2">No proposals yet</p>
                  <button
                    onClick={handleGenerateProposal}
                    className="inline-flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-xs"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Generate First</span>
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                  disabled={!lead.email}
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all duration-200 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </button>
                
                <button
                  onClick={() => window.open(`tel:${lead.phone}`, '_blank')}
                  disabled={!lead.phone}
                  className="w-full flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-500/30 transition-all duration-200 disabled:opacity-50"
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

      {/* Proposal Modal */}
      <ProposalModal
        isOpen={showProposalModal}
        onClose={handleProposalModalClose}
        lead={lead}
        onProposalGenerated={handleProposalGenerated}
      />

      {/* Project Conversion Modal */}
      <ProjectConversionModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        lead={lead}
        onProjectCreated={handleProjectCreated}
      />

      {/* AI Enrich Modal */}
      {showAIEnrichModal && aiEnrichData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-white flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-purple-400" />
                AI Lead Enrichment
              </h3>
              <button
                onClick={() => setShowAIEnrichModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Company Information */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-medium text-white mb-4">Company Intelligence</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Industry</label>
                    <p className="text-white font-medium">{aiEnrichData.industry}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Company Size</label>
                    <p className="text-white font-medium">{aiEnrichData.companySize}</p>
                  </div>
                </div>
              </div>

              {/* Budget & Timeline */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-medium text-white mb-4">Project Estimates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Estimated Budget</label>
                    <p className="text-2xl font-bold text-green-400">
                      ${aiEnrichData.budget.min.toLocaleString()} - ${aiEnrichData.budget.max.toLocaleString()} {aiEnrichData.budget.currency}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Timeline</label>
                    <p className="text-white">
                      {new Date(aiEnrichData.timeline.startDate).toLocaleDateString()} - {new Date(aiEnrichData.timeline.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-slate-400 capitalize">Urgency: {aiEnrichData.timeline.urgency}</p>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-medium text-white mb-4">AI Insights</h4>
                <div className="space-y-3">
                  {aiEnrichData.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-xs font-bold">{index + 1}</span>
                      </div>
                      <p className="text-slate-300 text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-medium text-white mb-4">AI Recommendations</h4>
                <div className="space-y-3">
                  {aiEnrichData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-300 text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-white/10">
                <button
                  onClick={() => setShowAIEnrichModal(false)}
                  className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Apply the AI insights to the lead data
                    setFormData(prev => ({
                      ...prev,
                      industry: aiEnrichData.industry,
                      budget: aiEnrichData.budget,
                      timeline: aiEnrichData.timeline
                    }))
                    toast.success('AI insights applied to lead data!')
                    setShowAIEnrichModal(false)
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 font-medium"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>Apply Insights</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* AI Follow-up Modal */}
      {showAIFollowUpModal && aiFollowUpData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-white flex items-center">
                <Bot className="w-6 h-6 mr-3 text-blue-400" />
                AI Follow-up Email
              </h3>
              <button
                onClick={() => setShowAIFollowUpModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Email Content */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="mb-4">
                  <label className="block text-sm text-slate-300 mb-2">Subject Line</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-white font-medium">{aiFollowUpData.subject}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Email Content</label>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <pre className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {aiFollowUpData.email}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Timing & Strategy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-lg font-medium text-white mb-4">Timing</h4>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <p className="text-slate-300 text-sm">{aiFollowUpData.timing}</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h4 className="text-lg font-medium text-white mb-4">Tone</h4>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                    <p className="text-slate-300 text-sm">{aiFollowUpData.tone}</p>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h4 className="text-lg font-medium text-white mb-4">Suggested Next Steps</h4>
                <div className="space-y-3">
                  {aiFollowUpData.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-xs font-bold">{index + 1}</span>
                      </div>
                      <p className="text-slate-300 text-sm">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-white/10">
                <button
                  onClick={() => setShowAIFollowUpModal(false)}
                  className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Copy email to clipboard
                    navigator.clipboard.writeText(aiFollowUpData.email)
                    toast.success('Email copied to clipboard!')
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200"
                >
                  <FileText className="w-5 h-5" />
                  <span>Copy Email</span>
                </button>
                <button
                  onClick={() => {
                    // Open email client
                    const emailUrl = `mailto:${lead.email}?subject=${encodeURIComponent(aiFollowUpData.subject)}&body=${encodeURIComponent(aiFollowUpData.email)}`
                    window.open(emailUrl, '_blank')
                    toast.success('Opening email client...')
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium"
                >
                  <Mail className="w-5 h-5" />
                  <span>Send Email</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quote Creation Modal */}
      {showQuoteModal && quoteFormData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-light text-white flex items-center">
                <FileText className="w-6 h-6 mr-3 text-blue-400" />
                Complete Quote Details
              </h3>
              <button
                onClick={() => {
                  setShowQuoteModal(false)
                  setQuoteFormData(null)
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <QuoteForm
              initialData={quoteFormData}
              onSave={handleSaveQuote}
              onCancel={() => {
                setShowQuoteModal(false)
                setQuoteFormData(null)
              }}
              saving={creatingQuote}
            />
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default LeadDetails 