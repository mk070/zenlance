import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  User, 
  DollarSign, 
  Calendar,
  Clock,
  CheckCircle,
  Send,
  AlertTriangle,
  X,
  Eye,
  Edit,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const Invoices = () => {
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Sample data - replace with API call
  const sampleInvoices = [
    {
      id: 1,
      invoiceNumber: 'INV-2024-001',
      title: 'Website Development',
      clientName: 'Tech Startup Inc.',
      amount: 5000,
      status: 'paid',
      dueDate: '2024-01-15',
      createdAt: '2023-12-15'
    },
    {
      id: 2,
      invoiceNumber: 'INV-2024-002',
      title: 'Mobile App Design',
      clientName: 'Creative Agency',
      amount: 3500,
      status: 'sent',
      dueDate: '2024-02-01',
      createdAt: '2024-01-01'
    },
    {
      id: 3,
      invoiceNumber: 'INV-2024-003',
      title: 'Brand Identity Package',
      clientName: 'Fashion Brand',
      amount: 2000,
      status: 'overdue',
      dueDate: '2024-01-20',
      createdAt: '2023-12-20'
    }
  ]

  // Load invoices from API
  const loadInvoices = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true)
      
      // Replace with actual API call
      const filteredData = sampleInvoices.filter(invoice => {
        const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
                             invoice.title.toLowerCase().includes(search.toLowerCase()) ||
                             invoice.clientName.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = status === 'all' || invoice.status === status
        return matchesSearch && matchesStatus
      })
      
      setInvoices(filteredData)
      setPagination({
        page: 1,
        limit: 20,
        total: filteredData.length,
        pages: Math.ceil(filteredData.length / 20)
      })
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  const refreshInvoices = async () => {
    setRefreshing(true)
    await loadInvoices(pagination.page, searchTerm, filterStatus)
    setRefreshing(false)
    toast.success('Invoices refreshed')
  }

  const handleSearch = (query) => {
    setSearchTerm(query)
    loadInvoices(1, query, filterStatus)
  }

  const handleStatusFilter = (status) => {
    setFilterStatus(status)
    loadInvoices(1, searchTerm, status)
  }

  const handleViewInvoice = (invoice) => {
    navigate(`/invoices/${invoice.id}`)
  }

  const handlePageChange = (newPage) => {
    loadInvoices(newPage, searchTerm, filterStatus)
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'sent':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'draft':
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
      case 'overdue':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      case 'cancelled':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return CheckCircle
      case 'sent':
        return Send
      case 'draft':
        return FileText
      case 'overdue':
        return AlertTriangle
      case 'cancelled':
        return X
      default:
        return FileText
    }
  }

  const filteredInvoices = invoices

  if (initialLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading invoices...</p>
        </div>
      </div>
    )
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
          <div>
            <h1 className="text-3xl font-light text-white mb-2">Invoices</h1>
            <p className="text-slate-400 font-light">
              Create, send, and track your invoices and payments
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshInvoices}
              disabled={refreshing}
              className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => navigate('/invoices/new')}
              className="flex items-center space-x-2 px-6 py-3 bg-cyan-400 hover:bg-cyan-500 text-black rounded-xl transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Create Invoice</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="appearance-none bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
            >
              <option value="all" className="bg-slate-800">All Status</option>
              <option value="draft" className="bg-slate-800">Draft</option>
              <option value="sent" className="bg-slate-800">Sent</option>
              <option value="paid" className="bg-slate-800">Paid</option>
              <option value="overdue" className="bg-slate-800">Overdue</option>
              <option value="cancelled" className="bg-slate-800">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </motion.div>

      {/* Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden mb-6"
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No invoices found</h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first invoice to get started'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button
                onClick={() => navigate('/invoices/new')}
                className="px-6 py-3 bg-cyan-400 hover:bg-cyan-500 text-black rounded-xl transition-colors font-medium"
              >
                Create Your First Invoice
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-400">
                <div className="col-span-3">Invoice</div>
                <div className="col-span-3">Client</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Due Date</div>
              </div>
            </div>

            {/* Invoices */}
            <div className="divide-y divide-white/10">
              {filteredInvoices.map((invoice, index) => {
                const StatusIcon = getStatusIcon(invoice.status)
                return (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    onClick={() => handleViewInvoice(invoice)}
                    className="px-6 py-4 hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Invoice Info */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-400/20">
                            <FileText className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium group-hover:text-cyan-300 transition-colors">
                              {invoice.invoiceNumber}
                            </p>
                            <p className="text-slate-400 text-sm truncate">{invoice.title}</p>
                          </div>
                        </div>
                      </div>

                      {/* Client */}
                      <div className="col-span-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300 truncate">{invoice.clientName}</span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <span className="text-white font-medium">
                            ${invoice.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="w-4 h-4 text-slate-400" />
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Due Date */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300 text-sm">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </>
        )}
      </motion.div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-sm">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} invoices
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-300 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Invoices 