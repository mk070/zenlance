import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Eye,
  Edit,
  RefreshCw,
  Crown,
  Globe,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const Clients = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [clientsPerPage] = useState(10)

  // Real clients from API

  useEffect(() => {
    const loadClients = async () => {
      try {
        const result = await apiClient.getClients()
        if (result.success) {
          setClients(result.data.clients || [])
        } else {
          console.error('Failed to load clients:', result.error)
          toast.error('Failed to load clients')
          setClients([])
        }
      } catch (error) {
        console.error('Error loading clients:', error)
        toast.error('Failed to load clients')
        setClients([])
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'inactive':
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const filteredClients = clients.filter(client => {
    const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.company || ''
    const matchesSearch = clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.company.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Pagination
  const indexOfLastClient = currentPage * clientsPerPage
  const indexOfFirstClient = indexOfLastClient - clientsPerPage
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient)
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage)

  if (loading) {
    return (
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
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
            <h1 className="text-3xl font-light text-white mb-2">Clients</h1>
            <p className="text-slate-400 font-light">
              Manage your client relationships and project history
            </p>
          </div>
          <button
            onClick={() => navigate('/clients/new')}
            className="bg-cyan-400 hover:bg-cyan-500 text-black px-6 py-3 rounded-xl transition-colors font-medium flex items-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add Client</span>
          </button>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end">
            <span className="text-slate-400 text-sm">
              {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>
      </motion.div>

      {/* Clients Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
      >
        {currentClients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-light text-white mb-2">No clients found</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery || selectedStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start by adding your first client'}
            </p>
            {(!searchQuery && selectedStatus === 'all') && (
              <button
                onClick={() => navigate('/clients/new')}
                className="bg-cyan-400 hover:bg-cyan-500 text-black px-6 py-3 rounded-xl transition-colors font-medium inline-flex items-center space-x-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add Your First Client</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-400">
                <div className="col-span-3">Client</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-2">Location</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Projects</div>
                <div className="col-span-2">Total Value</div>
              </div>
            </div>

            {/* Clients */}
            <div className="divide-y divide-white/10">
              {currentClients.map((client, index) => (
                <motion.div
                  key={client._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                  onClick={() => navigate(`/clients/${client._id}`)}
                  className="px-6 py-4 hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Client Info */}
                    <div className="col-span-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-400/20">
                          <Users className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-cyan-300 transition-colors">
                            {`${client.firstName || ''} ${client.lastName || ''}`.trim() || client.company || 'Unknown Client'}
                          </p>
                          <p className="text-sm text-slate-400">{client.company}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="col-span-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm text-slate-300">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{client.email || 'No email'}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center space-x-2 text-sm text-slate-400">
                            <Phone className="w-4 h-4" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2 text-sm text-slate-300">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {[client.address?.city, client.address?.state, client.address?.country]
                            .filter(Boolean)
                            .join(', ') || 'No location'}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(client.status || 'inactive')}`}>
                        {(client.status || 'inactive').charAt(0).toUpperCase() + (client.status || 'inactive').slice(1)}
                      </span>
                    </div>

                    {/* Projects Count */}
                    <div className="col-span-1">
                      <span className="text-white font-medium">{client.projects?.length || 0}</span>
                    </div>

                    {/* Total Value */}
                    <div className="col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-medium">
                          ${(client.financialMetrics?.totalRevenue || 0).toLocaleString()}
                        </span>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6 flex items-center justify-between"
        >
          <div className="text-sm text-slate-400">
            Showing {indexOfFirstClient + 1} to {Math.min(indexOfLastClient, filteredClients.length)} of {filteredClients.length} clients
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    currentPage === i + 1
                      ? 'bg-cyan-400 text-black'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Clients 