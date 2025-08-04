import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  FileText, 
  Wand2, 
  Settings, 
  Download,
  Mail,
  Eye,
  CheckCircle,
  Loader2,
  DollarSign,
  Calendar,
  User,
  Building2
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const ProposalModal = ({ isOpen, onClose, lead, onProposalGenerated }) => {
  const [generating, setGenerating] = useState(false)
  const [proposal, setProposal] = useState(null)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    title: `Business Proposal for ${lead?.firstName} ${lead?.lastName} - ${lead?.company || 'Project'}`,
    formatType: 'professional',
    tone: 'professional',
    customInstructions: '',
    // Deal data that can be edited
    dealData: {
      budget: {
        min: lead?.budget?.min || '',
        max: lead?.budget?.max || '',
        currency: lead?.budget?.currency || 'USD'
      },
      timeline: {
        startDate: lead?.timeline?.startDate || '',
        endDate: lead?.timeline?.endDate || '',
        urgency: lead?.timeline?.urgency || 'medium'
      },
      projectType: lead?.projectType || '',
      description: lead?.description || '',
      requirements: '',
      deliverables: '',
      additionalNotes: ''
    }
  })

  const formatTypes = [
    { value: 'professional', label: 'Professional', desc: 'Formal corporate structure' },
    { value: 'creative', label: 'Creative', desc: 'Engaging with visual elements' },
    { value: 'technical', label: 'Technical', desc: 'Detailed technical specifications' },
    { value: 'simple', label: 'Simple', desc: 'Clear and concise language' }
  ]

  const tones = [
    { value: 'formal', label: 'Formal', desc: 'Respectful and professional' },
    { value: 'friendly', label: 'Friendly', desc: 'Warm and approachable' },
    { value: 'confident', label: 'Confident', desc: 'Strong confidence in capabilities' },
    { value: 'consultative', label: 'Consultative', desc: 'Advisory and strategic' }
  ]

  const urgencyOptions = [
    { value: 'low', label: 'Low Priority', desc: 'Flexible timeline' },
    { value: 'medium', label: 'Medium Priority', desc: 'Standard timeline' },
    { value: 'high', label: 'High Priority', desc: 'Urgent timeline' },
    { value: 'critical', label: 'Critical', desc: 'Immediate attention needed' }
  ]

  const handleInputChange = (field, value) => {
    if (field.startsWith('dealData.')) {
      const fieldPath = field.split('.')
      if (fieldPath.length === 3) {
        // Handle nested objects like dealData.budget.min
        setFormData(prev => ({
          ...prev,
          dealData: {
            ...prev.dealData,
            [fieldPath[1]]: {
              ...prev.dealData[fieldPath[1]],
              [fieldPath[2]]: value
            }
          }
        }))
      } else {
        // Handle direct dealData fields
        setFormData(prev => ({
          ...prev,
          dealData: {
            ...prev.dealData,
            [fieldPath[1]]: value
          }
        }))
      }
    } else {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    }
  }

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      
      console.log('Generating proposal with data:', {
        leadId: lead._id,
        title: formData.title,
        formatType: formData.formatType,
        tone: formData.tone,
        customInstructions: formData.customInstructions,
        dealData: formData.dealData
      })
      
      const result = await apiClient.generateProposal({
        leadId: lead._id,
        title: formData.title,
        formatType: formData.formatType,
        tone: formData.tone,
        customInstructions: formData.customInstructions,
        dealData: formData.dealData
      })

      console.log('Proposal generation result:', result)

      if (result.success) {
        setProposal(result.data.proposal)
        toast.success('Proposal generated successfully!')
        if (onProposalGenerated) {
          onProposalGenerated(result.data.proposal)
        }
      } else {
        console.error('Proposal generation failed:', result)
        toast.error(result.error || 'Failed to generate proposal')
      }
    } catch (error) {
      console.error('Error generating proposal:', error)
      
      // Show more detailed error message
      let errorMessage = 'Failed to generate proposal'
      if (error.response) {
        errorMessage = `Server error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`
      } else if (error.request) {
        errorMessage = 'Network error: Could not reach the server'
      } else {
        errorMessage = `Error: ${error.message}`
      }
      
      toast.error(errorMessage, { duration: 5000 })
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async () => {
    try {
      const blob = await apiClient.downloadProposal(proposal._id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `proposal-${proposal.proposalNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Proposal downloaded successfully!')
    } catch (error) {
      console.error('Error downloading proposal:', error)
      toast.error('Failed to download proposal')
    }
  }

  const handleView = () => {
    const viewUrl = apiClient.viewProposal(proposal._id)
    window.open(viewUrl, '_blank')
  }

  const handleSend = async () => {
    try {
      setSending(true)
      
      const result = await apiClient.sendProposal(proposal._id, {
        subject: `Proposal from Zenlancer - ${proposal.title}`,
        message: `Dear ${lead.firstName},\n\nI'm pleased to present you with a comprehensive proposal for your project.\n\nPlease review the attached proposal and feel free to reach out with any questions.\n\nBest regards,\nZenlancer Team`
      })

      if (result.success) {
        toast.success('Proposal sent successfully!')
        setProposal(prev => ({ ...prev, status: 'sent', sentDate: new Date() }))
      } else {
        toast.error(result.error || 'Failed to send proposal')
      }
    } catch (error) {
      console.error('Error sending proposal:', error)
      toast.error('Failed to send proposal')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-light text-white">AI Proposal Generator</h3>
              <p className="text-slate-400 text-sm">Generate a professional proposal with AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!proposal ? (
          <div className="space-y-6">
            {/* Lead Information Summary */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-lg font-medium text-white mb-3 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Client Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Client:</span>
                  <p className="text-white">{lead?.firstName} {lead?.lastName}</p>
                </div>
                <div>
                  <span className="text-slate-400">Company:</span>
                  <p className="text-white">{lead?.company || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>
                  <p className="text-white">{lead?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <p className="text-white">{lead?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Editable Deal Information */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Deal Information
              </h4>
              
              <div className="space-y-4">
                {/* Budget Section */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Budget Range (Optional)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <input
                        type="number"
                        value={formData.dealData.budget.min}
                        onChange={(e) => handleInputChange('dealData.budget.min', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                        placeholder="Min budget"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={formData.dealData.budget.max}
                        onChange={(e) => handleInputChange('dealData.budget.max', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                        placeholder="Max budget"
                      />
                    </div>
                    <div>
                      <select
                        value={formData.dealData.budget.currency}
                        onChange={(e) => handleInputChange('dealData.budget.currency', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Timeline Section */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project Timeline (Optional)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <input
                        type="date"
                        value={formData.dealData.timeline.startDate}
                        onChange={(e) => handleInputChange('dealData.timeline.startDate', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        value={formData.dealData.timeline.endDate}
                        onChange={(e) => handleInputChange('dealData.timeline.endDate', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                      />
                    </div>
                    <div>
                      <select
                        value={formData.dealData.timeline.urgency}
                        onChange={(e) => handleInputChange('dealData.timeline.urgency', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                      >
                        {urgencyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Project Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project Type (Optional)</label>
                  <input
                    type="text"
                    value={formData.dealData.projectType}
                    onChange={(e) => handleInputChange('dealData.projectType', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                    placeholder="e.g., Web Development, Mobile App, Consulting..."
                  />
                </div>

                {/* Project Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Project Description (Optional)</label>
                  <textarea
                    value={formData.dealData.description}
                    onChange={(e) => handleInputChange('dealData.description', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 h-20 resize-none"
                    placeholder="Brief description of the project..."
                  />
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Key Requirements (Optional)</label>
                  <textarea
                    value={formData.dealData.requirements}
                    onChange={(e) => handleInputChange('dealData.requirements', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 h-20 resize-none"
                    placeholder="Key requirements or specifications..."
                  />
                </div>

                {/* Expected Deliverables */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Expected Deliverables (Optional)</label>
                  <textarea
                    value={formData.dealData.deliverables}
                    onChange={(e) => handleInputChange('dealData.deliverables', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 h-20 resize-none"
                    placeholder="What should be delivered to the client..."
                  />
                </div>
              </div>
            </div>

            {/* Proposal Configuration */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h4 className="text-lg font-medium text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Proposal Configuration
              </h4>
              
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Proposal Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  placeholder="Enter proposal title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Format Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {formatTypes.map((format) => (
                    <div
                      key={format.value}
                      onClick={() => handleInputChange('formatType', format.value)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.formatType === format.value
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                        <div className={`font-medium text-sm ${
                        formData.formatType === format.value ? 'text-cyan-400' : 'text-white'
                      }`}>
                        {format.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{format.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Tone</label>
                <div className="grid grid-cols-2 gap-3">
                  {tones.map((tone) => (
                    <div
                      key={tone.value}
                      onClick={() => handleInputChange('tone', tone.value)}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.tone === tone.value
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                        <div className={`font-medium text-sm ${
                        formData.tone === tone.value ? 'text-cyan-400' : 'text-white'
                      }`}>
                        {tone.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{tone.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Additional Notes (Optional)</label>
                  <textarea
                    value={formData.dealData.additionalNotes}
                    onChange={(e) => handleInputChange('dealData.additionalNotes', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 h-20 resize-none"
                    placeholder="Any additional notes or special instructions..."
                  />
                </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Custom Instructions (Optional)</label>
                <textarea
                  value={formData.customInstructions}
                  onChange={(e) => handleInputChange('customInstructions', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 h-20 resize-none"
                  placeholder="Any specific requirements or instructions for the AI..."
                />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-6 py-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !formData.title.trim()}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Generate Proposal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Generated Proposal Actions */
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/20 rounded-xl p-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h4 className="text-xl font-medium text-white mb-2">Proposal Generated Successfully!</h4>
              <p className="text-slate-300">{proposal.title}</p>
              <div className="flex items-center justify-center space-x-4 mt-4 text-sm text-slate-400">
                <span>Proposal #{proposal.proposalNumber}</span>
                <span>•</span>
                <span>{new Date(proposal.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  proposal.status === 'generated' ? 'bg-blue-400/20 text-blue-400' :
                  proposal.status === 'sent' ? 'bg-emerald-400/20 text-emerald-400' :
                  'bg-slate-400/20 text-slate-400'
                }`}>
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleView}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <Eye className="w-5 h-5" />
                <span>View PDF</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <Download className="w-5 h-5" />
                <span>Download</span>
              </button>

              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Send to Client</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-white/10">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-medium"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default ProposalModal 