import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  ChevronRight,
  FileText,
  User,
  Building2,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Download,
  Send,
  Edit3,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  Copy,
  CreditCard,
  Printer,
  Plus
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const InvoiceDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [invoice, setInvoice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    title: '',
    description: '',
    dueDate: '',
    status: '',
    items: [],
    notes: '',
    terms: ''
  })

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'text-gray-400 bg-gray-400/10' },
    { value: 'sent', label: 'Sent', color: 'text-blue-400 bg-blue-400/10' },
    { value: 'viewed', label: 'Viewed', color: 'text-yellow-400 bg-yellow-400/10' },
    { value: 'paid', label: 'Paid', color: 'text-green-400 bg-green-400/10' },
    { value: 'overdue', label: 'Overdue', color: 'text-red-400 bg-red-400/10' },
    { value: 'cancelled', label: 'Cancelled', color: 'text-slate-400 bg-slate-400/10' }
  ]

  // Load invoice data
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true)
        const result = await apiClient.getInvoice(id)
        
        if (result.success) {
          setInvoice(result.data.invoice)
          setFormData({
            invoiceNumber: result.data.invoice.invoiceNumber || '',
            title: result.data.invoice.title || '',
            description: result.data.invoice.description || '',
            dueDate: result.data.invoice.dueDate ? new Date(result.data.invoice.dueDate).toISOString().split('T')[0] : '',
            status: result.data.invoice.status || 'draft',
            items: result.data.invoice.items || [],
            notes: result.data.invoice.notes || '',
            terms: result.data.invoice.terms || ''
          })
        } else {
          toast.error('Failed to load invoice details')
          navigate('/invoices')
        }
      } catch (error) {
        console.error('Error loading invoice:', error)
        toast.error('Failed to load invoice details')
        navigate('/invoices')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadInvoice()
    }
  }, [id, navigate])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    }
    
    // Auto-calculate total for the item
    if (field === 'quantity' || field === 'rate') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : parseFloat(updatedItems[index].quantity) || 0
      const rate = field === 'rate' ? parseFloat(value) || 0 : parseFloat(updatedItems[index].rate) || 0
      updatedItems[index].total = quantity * rate
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        description: '',
        quantity: 1,
        rate: 0,
        total: 0
      }]
    }))
  }

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const result = await apiClient.updateInvoice(id, formData)
      
      if (result.success) {
        setInvoice(result.data.invoice)
        setIsEditing(false)
        toast.success('Invoice updated successfully!')
      } else {
        toast.error(result.error || 'Failed to update invoice')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error('Failed to update invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleSendInvoice = async () => {
    try {
      setSaving(true)
      const result = await apiClient.sendInvoice(id)
      
      if (result.success) {
        setInvoice(prev => ({ ...prev, status: 'sent', sentDate: new Date() }))
        toast.success('Invoice sent successfully!')
      } else {
        toast.error(result.error || 'Failed to send invoice')
      }
    } catch (error) {
      console.error('Error sending invoice:', error)
      toast.error('Failed to send invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      const result = await apiClient.downloadInvoice(id)
      // Handle blob download
      const url = window.URL.createObjectURL(new Blob([result]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Invoice-${invoice.invoiceNumber}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Invoice downloaded successfully!')
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Failed to download invoice')
    }
  }

  const handleMarkAsPaid = async () => {
    if (!window.confirm('Mark this invoice as paid?')) {
      return
    }

    try {
      setSaving(true)
      const result = await apiClient.markInvoiceAsPaid(id)
      
      if (result.success) {
        setInvoice(prev => ({ ...prev, status: 'paid', paidDate: new Date() }))
        toast.success('Invoice marked as paid!')
      } else {
        toast.error(result.error || 'Failed to mark invoice as paid')
      }
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
      toast.error('Failed to mark invoice as paid')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      const result = await apiClient.deleteInvoice(id)
      
      if (result.success) {
        toast.success('Invoice deleted successfully!')
        navigate('/invoices')
      } else {
        toast.error(result.error || 'Failed to delete invoice')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error('Failed to delete invoice')
    } finally {
      setSaving(false)
    }
  }

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status)
    return statusOption ? statusOption.color : 'text-gray-400 bg-gray-400/10'
  }

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.total || 0), 0)
  }

  const calculateTax = (subtotal) => {
    return subtotal * (invoice?.taxRate || 0) / 100
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax(subtotal)
    return subtotal + tax
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading invoice details...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Invoice not found</h3>
          <p className="text-slate-400 mb-6">The invoice you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all duration-200"
          >
            Back to Invoices
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
              onClick={() => navigate('/invoices')}
              className="hover:text-white transition-colors"
            >
              Invoices
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{invoice.invoiceNumber}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/invoices')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-purple-500/20">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              
              <div>
                <h1 className="text-3xl font-light text-white mb-1">
                  {invoice.invoiceNumber}
                </h1>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                    {statusOptions.find(opt => opt.value === invoice.status)?.label || invoice.status}
                  </span>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-white">${invoice.total?.toLocaleString() || '0'}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-400">Due {new Date(invoice.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {invoice.status !== 'paid' && (
                <motion.button
                  onClick={handleMarkAsPaid}
                  disabled={saving}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-500/30 transition-all duration-200 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark Paid</span>
                </motion.button>
              )}
              
              <motion.button
                onClick={handleSendInvoice}
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all duration-200 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </motion.button>
              
              <motion.button
                onClick={handleDownloadInvoice}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </motion.button>
              
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
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Invoice Header */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            {/* Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Bill To:</h3>
                {invoice.client ? (
                  <div className="space-y-2">
                    <p className="text-white font-medium">
                      {invoice.client.firstName} {invoice.client.lastName}
                    </p>
                    {invoice.client.company && (
                      <p className="text-slate-300">{invoice.client.company}</p>
                    )}
                    <p className="text-slate-300">{invoice.client.email}</p>
                    {invoice.client.phone && (
                      <p className="text-slate-300">{invoice.client.phone}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400">No client information</p>
                )}
              </div>
              
              <div className="text-right">
                <h3 className="text-lg font-medium text-white mb-4">Invoice Details:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Invoice #:</span>
                    <span className="text-white">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date:</span>
                    <span className="text-white">
                      {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Due Date:</span>
                    <span className="text-white">
                      {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {statusOptions.find(opt => opt.value === invoice.status)?.label || invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Title & Description */}
            <div className="mb-8">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                      placeholder="Invoice title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                      placeholder="Invoice description"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  {invoice.title && (
                    <h2 className="text-2xl font-medium text-white mb-2">{invoice.title}</h2>
                  )}
                  {invoice.description && (
                    <p className="text-slate-300">{invoice.description}</p>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Items */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-white mb-4">Items:</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 text-slate-300 font-medium">Description</th>
                      <th className="text-right py-3 text-slate-300 font-medium w-24">Qty</th>
                      <th className="text-right py-3 text-slate-300 font-medium w-32">Rate</th>
                      <th className="text-right py-3 text-slate-300 font-medium w-32">Total</th>
                      {isEditing && <th className="w-12"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-b border-white/5">
                        <td className="py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-white/20"
                              placeholder="Item description"
                            />
                          ) : (
                            <span className="text-white">{item.description}</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-right focus:outline-none focus:ring-1 focus:ring-white/20"
                              min="1"
                            />
                          ) : (
                            <span className="text-white">{item.quantity}</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-right focus:outline-none focus:ring-1 focus:ring-white/20"
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            <span className="text-white">${item.rate?.toFixed(2) || '0.00'}</span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <span className="text-white font-medium">${item.total?.toFixed(2) || '0.00'}</span>
                        </td>
                        {isEditing && (
                          <td className="py-3">
                            <button
                              onClick={() => removeItem(index)}
                              className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {isEditing && (
                  <button
                    onClick={addItem}
                    className="mt-4 flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 text-slate-400 hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="text-white">${calculateSubtotal().toFixed(2)}</span>
                </div>
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax ({invoice.taxRate}%):</span>
                    <span className="text-white">${calculateTax(calculateSubtotal()).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t border-white/10 pt-2">
                  <span className="text-white">Total:</span>
                  <span className="text-white">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms || isEditing) && (
              <div className="mt-8 pt-8 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Notes:</h4>
                    {isEditing ? (
                      <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                        placeholder="Additional notes"
                      />
                    ) : (
                      <p className="text-slate-300 text-sm">{invoice.notes || 'No notes'}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Terms & Conditions:</h4>
                    {isEditing ? (
                      <textarea
                        value={formData.terms}
                        onChange={(e) => handleInputChange('terms', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none"
                        placeholder="Payment terms and conditions"
                      />
                    ) : (
                      <p className="text-slate-300 text-sm">{invoice.terms || 'Standard payment terms apply'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">Actions</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-xl hover:bg-gray-500/30 transition-all duration-200"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast.success('Invoice link copied to clipboard!')
                }}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-500/30 transition-all duration-200"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </button>
              
              <button
                onClick={() => navigate(`/invoices/new?duplicate=${id}`)}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-all duration-200"
              >
                <Copy className="w-4 h-4" />
                <span>Duplicate</span>
              </button>
              
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all duration-200 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetails 