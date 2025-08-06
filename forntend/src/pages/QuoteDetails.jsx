import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  ChevronRight,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Edit3,
  Save,
  X,
  Send,
  Copy,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Printer,
  Plus
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const QuoteDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [sending, setSending] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    validUntil: '',
    notes: '',
    terms: ''
  })

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'text-gray-400 bg-gray-400/10', icon: Clock },
    { value: 'sent', label: 'Sent', color: 'text-blue-400 bg-blue-400/10', icon: Send },
    { value: 'accepted', label: 'Accepted', color: 'text-emerald-400 bg-emerald-400/10', icon: CheckCircle },
    { value: 'declined', label: 'Declined', color: 'text-red-400 bg-red-400/10', icon: AlertCircle },
    { value: 'expired', label: 'Expired', color: 'text-orange-400 bg-orange-400/10', icon: AlertCircle }
  ]

  // Load quote data
  useEffect(() => {
    const loadQuote = async () => {
      try {
        setLoading(true)
        const result = await apiClient.getQuote(id)
        
        if (result.success) {
          const quoteData = result.data
          setQuote(quoteData)
          setFormData({
            title: quoteData.title || '',
            description: quoteData.description || '',
            items: quoteData.items || [],
            subtotal: quoteData.subtotal || 0,
            tax: quoteData.tax || 0,
            total: quoteData.total || 0,
            validUntil: quoteData.validUntil ? quoteData.validUntil.split('T')[0] : '',
            notes: quoteData.notes || '',
            terms: quoteData.terms || ''
          })
        } else {
          toast.error('Failed to load quote details')
          navigate('/quotes')
        }
      } catch (error) {
        console.error('Error loading quote:', error)
        
        // Show user-friendly error message
        let errorMessage = 'Failed to load quote details'
        if (error.message && error.message !== '[object Object]') {
          errorMessage = error.message
        } else if (error.data?.error) {
          errorMessage = error.data.error
        } else if (error.data?.message) {
          errorMessage = error.data.message
        }
        
        toast.error(errorMessage)
        navigate('/quotes')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadQuote()
    }
  }, [id, navigate])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

  const handleSave = async () => {
    try {
      setSaving(true)
      const result = await apiClient.updateQuote(id, formData)
      
      if (result.success) {
        setQuote(result.data)
        setIsEditing(false)
        toast.success('Quote updated successfully!')
        
        // Reload to get fresh data
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to update quote')
      }
    } catch (error) {
      console.error('Error updating quote:', error)
      toast.error('Failed to update quote')
    } finally {
      setSaving(false)
    }
  }

  const handleSendQuote = async () => {
    if (!quote.clientEmail) {
      toast.error('Client email is required to send quote')
      return
    }

    if (!window.confirm(`Send quote to ${quote.clientEmail}?`)) {
      return
    }

    try {
      setSending(true)
      const result = await apiClient.sendQuote(id, {
        to: quote.clientEmail,
        subject: `Quote ${quote.quoteNumber} from ${quote.companyName || 'Your Company'}`,
        message: `Dear ${quote.clientName || 'Valued Client'},

Please find attached quote ${quote.quoteNumber} for your requested services.

Quote Details:
- Quote Number: ${quote.quoteNumber}
- Total Amount: $${quote.total?.toLocaleString() || '0'}
- Valid Until: ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'Please contact us for validity'}

This quote includes all the services and features we discussed. Please review the details and let us know if you have any questions or would like to proceed.

We're excited about the opportunity to work with you!

Best regards,
${quote.companyName || 'Your Company'}`
      })
      
      if (result.success) {
        setQuote(prev => ({ ...prev, status: 'sent', sentDate: new Date() }))
        toast.success(`Quote sent successfully to ${quote.clientEmail}!`)
      } else {
        toast.error(result.error || 'Failed to send quote')
      }
    } catch (error) {
      console.error('Error sending quote:', error)
      toast.error('Failed to send quote')
    } finally {
      setSending(false)
    }
  }

  const handleDuplicateQuote = async () => {
    try {
      const result = await apiClient.duplicateQuote(id)
      if (result.success) {
        toast.success('Quote duplicated successfully!')
        navigate(`/quotes/${result.data._id}`)
      } else {
        toast.error('Failed to duplicate quote')
      }
    } catch (error) {
      console.error('Error duplicating quote:', error)
      toast.error('Failed to duplicate quote')
    }
  }

  const handleConvertToInvoice = async () => {
    if (!window.confirm('Are you sure you want to convert this quote to an invoice?')) {
      return
    }

    try {
      const result = await apiClient.convertQuoteToInvoice(id)
      if (result.success) {
        toast.success('Quote converted to invoice successfully!')
        navigate(`/invoices/${result.data._id}`)
      } else {
        toast.error('Failed to convert quote to invoice')
      }
    } catch (error) {
      console.error('Error converting quote:', error)
      toast.error('Failed to convert quote to invoice')
    }
  }

  const handleDownloadQuote = async () => {
    try {
      const response = await apiClient.downloadQuote(id)
      // The response is the raw response object, get the blob
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Quote-${quote.quoteNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Quote downloaded successfully!')
    } catch (error) {
      console.error('Error downloading quote:', error)
      toast.error('Failed to download quote')
    }
  }

  const getStatusInfo = (status) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0]
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading quote details...</p>
        </div>
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Quote not found</h3>
          <p className="text-slate-400 mb-6">The quote you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/quotes')}
            className="px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all duration-200"
          >
            Back to Quotes
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusInfo(quote.status)
  const StatusIcon = statusInfo.icon

  return (
    <div className="h-full flex flex-col">
      {/* Header with Breadcrumbs */}
      <div className="border-b border-gray-800/50 bg-black/40 backdrop-blur-xl">
        <div className="px-8 py-6">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-sm text-slate-400 mb-4">
            <button
              onClick={() => navigate('/quotes')}
              className="hover:text-white transition-colors"
            >
              Quotes
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">#{quote.quoteNumber}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/quotes')}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div>
                <h1 className="text-2xl font-light text-white">{quote.title}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full border text-sm font-medium ${statusInfo.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="capitalize">{statusInfo.label}</span>
                  </div>
                  <span className="text-sm text-slate-400">Quote #{quote.quoteNumber}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Action Buttons */}
              {quote.status === 'draft' && (
                <button
                  onClick={handleSendQuote}
                  disabled={sending}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-400 hover:to-cyan-400 transition-all duration-200 disabled:opacity-50"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{sending ? 'Sending...' : 'Send Quote'}</span>
                </button>
              )}

              {quote.status === 'accepted' && (
                <button
                  onClick={handleConvertToInvoice}
                  className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-2 rounded-xl font-medium hover:from-emerald-400 hover:to-green-400 transition-all duration-200"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Convert to Invoice</span>
                </button>
              )}

              <button
                onClick={handleDuplicateQuote}
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Duplicate</span>
              </button>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:from-cyan-400 hover:to-blue-400 transition-all duration-200 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Quote Header Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Client Information */}
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">Client Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span className="text-white">{quote.clientName}</span>
                </div>
                {quote.clientEmail && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{quote.clientEmail}</span>
                  </div>
                )}
                {quote.clientPhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{quote.clientPhone}</span>
                  </div>
                )}
                {quote.clientAddress && (
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{quote.clientAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quote Information */}
            <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">Quote Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Quote Number</span>
                  <span className="text-white font-medium">#{quote.quoteNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Date Created</span>
                  <span className="text-white">{new Date(quote.createdAt).toLocaleDateString()}</span>
                </div>
                {quote.validUntil && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Valid Until</span>
                    <span className="text-white">{new Date(quote.validUntil).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Amount</span>
                  <span className="text-emerald-400 font-semibold text-lg">
                    ${quote.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Content */}
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            {/* Title and Description */}
            <div className="mb-8">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full text-2xl font-light bg-transparent border-b border-white/20 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 pb-2"
                    placeholder="Quote title"
                  />
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 p-4 resize-none"
                    placeholder="Quote description"
                  />
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-light text-white mb-2">{quote.title}</h2>
                  {quote.description && (
                    <p className="text-slate-300">{quote.description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Items</h3>
                {isEditing && (
                  <button
                    onClick={addItem}
                    className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 text-sm font-medium text-slate-400">Description</th>
                      <th className="text-right py-3 text-sm font-medium text-slate-400">Qty</th>
                      <th className="text-right py-3 text-sm font-medium text-slate-400">Rate</th>
                      <th className="text-right py-3 text-sm font-medium text-slate-400">Amount</th>
                      {isEditing && <th className="w-12"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {isEditing
                      ? formData.items.map((item, index) => (
                          <tr key={index} className="border-b border-white/5">
                            <td className="py-4">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 px-3 py-2"
                                placeholder="Item description"
                              />
                            </td>
                            <td className="py-4 text-right">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-20 bg-white/5 border border-white/10 rounded-lg text-white text-right focus:outline-none focus:ring-1 focus:ring-cyan-400/50 px-3 py-2"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="py-4 text-right">
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                className="w-24 bg-white/5 border border-white/10 rounded-lg text-white text-right focus:outline-none focus:ring-1 focus:ring-cyan-400/50 px-3 py-2"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="py-4 text-right text-white font-medium">
                              ${(item.amount || 0).toFixed(2)}
                            </td>
                            <td className="py-4 text-right">
                              <button
                                onClick={() => removeItem(index)}
                                disabled={formData.items.length === 1}
                                className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      : quote.items.map((item, index) => (
                          <tr key={index} className="border-b border-white/5">
                            <td className="py-4 text-white">{item.description}</td>
                            <td className="py-4 text-right text-slate-300">{item.quantity}</td>
                            <td className="py-4 text-right text-slate-300">${item.rate.toFixed(2)}</td>
                            <td className="py-4 text-right text-white font-medium">${item.amount.toFixed(2)}</td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mt-6">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-white">
                      ${isEditing ? formData.subtotal.toFixed(2) : quote.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {isEditing ? (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-400">Tax</span>
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
                        className="w-20 bg-white/5 border border-white/10 rounded-lg text-white text-right focus:outline-none focus:ring-1 focus:ring-cyan-400/50 px-3 py-1"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  ) : (
                    <div className="flex justify-between py-2">
                      <span className="text-slate-400">Tax</span>
                      <span className="text-white">${quote.tax.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 border-t border-white/10">
                    <span className="text-lg font-medium text-white">Total</span>
                    <span className="text-lg font-semibold text-emerald-400">
                      ${isEditing ? formData.total.toFixed(2) : quote.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Notes</h3>
                {isEditing ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 p-4 resize-none"
                    placeholder="Internal notes"
                  />
                ) : (
                  <p className="text-slate-300 bg-white/5 rounded-xl p-4 min-h-[100px]">
                    {quote.notes || 'No notes provided'}
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-4">Terms & Conditions</h3>
                {isEditing ? (
                  <textarea
                    value={formData.terms}
                    onChange={(e) => handleInputChange('terms', e.target.value)}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 p-4 resize-none"
                    placeholder="Terms and conditions"
                  />
                ) : (
                  <p className="text-slate-300 bg-white/5 rounded-xl p-4 min-h-[100px]">
                    {quote.terms || 'No terms specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-between bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleDownloadQuote}
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
            </div>

            <div className="text-sm text-slate-400">
              Last updated: {new Date(quote.updatedAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuoteDetails 