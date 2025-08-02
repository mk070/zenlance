import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save,
  Send,
  FileText,
  User,
  DollarSign,
  Calendar,
  Plus,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const CreateInvoice = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    invoiceNumber: `INV-${Date.now()}`,
    title: '',
    description: '',
    dueDate: '',
    currency: 'USD',
    items: [
      { description: '', quantity: 1, rate: 0, amount: 0 }
    ],
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    total: 0,
    notes: ''
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Recalculate totals if tax rate changes
    if (field === 'taxRate') {
      calculateTotals({ ...formData, [field]: value })
    }
  }

  const handleItemChange = (index, field, value) => {
    const updatedItems = formData.items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value }
        // Calculate amount when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate
        }
        return updatedItem
      }
      return item
    })
    
    const updatedFormData = { ...formData, items: updatedItems }
    setFormData(updatedFormData)
    calculateTotals(updatedFormData)
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index)
      const updatedFormData = { ...formData, items: updatedItems }
      setFormData(updatedFormData)
      calculateTotals(updatedFormData)
    }
  }

  const calculateTotals = (data) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = subtotal * (data.taxRate / 100)
    const total = subtotal + taxAmount
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total
    }))
  }

  const handleSubmit = async (isDraft = false) => {
    try {
      setLoading(true)
      
      // Validation
      if (!formData.clientName.trim()) {
        toast.error('Please enter client name')
        return
      }
      
      if (!formData.title.trim()) {
        toast.error('Please enter invoice title')
        return
      }
      
      if (formData.items.some(item => !item.description.trim())) {
        toast.error('Please fill in all item descriptions')
        return
      }

      const invoiceData = {
        ...formData,
        status: isDraft ? 'draft' : 'sent',
        createdAt: new Date().toISOString(),
        dueDate: new Date(formData.dueDate).toISOString()
      }

      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(isDraft ? 'Invoice saved as draft!' : 'Invoice created and sent!')
      navigate('/invoices')
      
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast.error(isDraft ? 'Failed to save invoice' : 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/invoices')}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-light text-white mb-2">Create Invoice</h1>
              <p className="text-slate-400 font-light">
                Generate a professional invoice for your client
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="bg-white/10 hover:bg-white/15 text-white px-6 py-2 rounded-xl transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>
            
            <button
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="bg-cyan-400 hover:bg-cyan-500 text-black px-6 py-2 rounded-xl transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create & Send'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center space-x-2 mb-6">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xl font-light text-white">Invoice Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-white font-medium mb-2 block">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                />
              </div>
              
              <div>
                <label className="text-white font-medium mb-2 block">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="text-white font-medium mb-2 block">
                Invoice Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                placeholder="Website Development Services"
                required
              />
            </div>
            
            <div className="mt-6">
              <label className="text-white font-medium mb-2 block">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all resize-none"
                placeholder="Brief description of the work performed..."
                rows={3}
              />
            </div>
          </motion.div>

          {/* Client Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center space-x-2 mb-6">
              <User className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xl font-light text-white">Client Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-white font-medium mb-2 block">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                  placeholder="Acme Corporation"
                  required
                />
              </div>
              
              <div>
                <label className="text-white font-medium mb-2 block">
                  Client Email
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                  placeholder="client@acme.com"
                />
              </div>
            </div>
          </motion.div>

          {/* Invoice Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-light text-white">Invoice Items</h3>
              </div>
              <button
                onClick={addItem}
                className="bg-cyan-400 hover:bg-cyan-500 text-black px-4 py-2 rounded-xl transition-colors font-medium flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-5">
                      <label className="text-white font-medium mb-2 block text-sm">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 transition-all"
                        placeholder="Service or product description"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-white font-medium mb-2 block text-sm">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400/50 transition-all"
                        min="1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-white font-medium mb-2 block text-sm">
                        Rate
                      </label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400/50 transition-all"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-white font-medium mb-2 block text-sm">
                        Amount
                      </label>
                      <div className="text-white font-medium py-2">
                        ${item.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      {formData.items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-xl font-light text-white mb-4">Notes</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all resize-none"
              placeholder="Payment terms, additional notes, or special instructions..."
              rows={4}
            />
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Invoice Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-xl font-light text-white mb-4">Invoice Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Subtotal:</span>
                <span className="text-white font-medium">${formData.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Tax Rate:</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={formData.taxRate}
                      onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                      className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-cyan-400/50"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-slate-400">%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Tax Amount:</span>
                  <span className="text-white font-medium">${formData.taxAmount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium text-lg">Total:</span>
                  <span className="text-cyan-400 font-bold text-xl">${formData.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Currency Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-xl font-light text-white mb-4">Settings</h3>
            
            <div>
              <label className="text-white font-medium mb-2 block">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all appearance-none cursor-pointer"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default CreateInvoice 