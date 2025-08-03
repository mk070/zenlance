import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Share2, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Repeat2,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { 
  Facebook as FacebookIcon, 
  Instagram as InstagramIcon, 
  Twitter as TwitterIcon, 
  LinkedIn as LinkedInIcon 
} from '@mui/icons-material'
import toast from 'react-hot-toast'
import { 
  getFilteredPosts, 
  getAnalytics, 
  getAllPosts,
  updatePostPerformance,
  getMockConnectedAccounts,
  getPlatformColor,
  getStatusColor,
  formatDate
} from '../lib/social-api-client'

// Helper function to get platform icon
const getPlatformIcon = (platform) => {
  switch (platform) {
    case 'facebook':
      return <FacebookIcon sx={{ fontSize: 16, color: '#06b6d4' }} />
    case 'instagram':
      return <InstagramIcon sx={{ fontSize: 16, color: '#06b6d4' }} />
    case 'twitter':
      return <TwitterIcon sx={{ fontSize: 16, color: '#06b6d4' }} />
    case 'linkedin':
      return <LinkedInIcon sx={{ fontSize: 16, color: '#06b6d4' }} />
    default:
      return platform.substring(0, 1).toUpperCase()
  }
}

const SocialMedia = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [connectedAccounts, setConnectedAccounts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [analytics, setAnalytics] = useState({
    totalPosts: 0,
    scheduledPosts: 0,
    totalReach: 0,
    totalEngagement: 0
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Load posts and analytics from API
  const loadPosts = async () => {
    try {
      setLoading(true)
      
      // Load posts from API
      const postsResult = await getFilteredPosts({
        page: pagination.page,
        limit: pagination.limit,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        platform: filterPlatform !== 'all' ? filterPlatform : undefined,
        search: searchTerm || undefined
      })

      if (postsResult.success) {
        const postsData = postsResult.data.posts.map(post => ({
          id: post._id || post.id,
          content: post.content,
          platforms: post.platforms,
          status: post.status,
          scheduledFor: post.scheduledDate,
          publishedAt: post.publishedDate,
          engagement: {
            likes: post.performance?.likes || 0,
            comments: post.performance?.comments || 0,
            shares: post.performance?.shares || 0
          },
          createdAt: post.createdAt
        }))
        
        setPosts(postsData)
        setFilteredPosts(postsData)
        setPagination(postsResult.data.pagination)
      } else {
        console.error('Failed to load posts:', postsResult.error)
        toast.error('Failed to load posts')
      }

      // Load analytics from API
      const analyticsResult = await getAnalytics(30)
      if (analyticsResult.success) {
        const data = analyticsResult.data
        setAnalytics({
          totalPosts: data.totalPosts || 0,
          scheduledPosts: data.scheduledPosts || 0,
          totalReach: data.performanceStats?.totalViews || 0,
          totalEngagement: (data.performanceStats?.totalLikes || 0) + 
                          (data.performanceStats?.totalShares || 0) + 
                          (data.performanceStats?.totalComments || 0)
        })
      } else {
        console.error('Failed to load analytics:', analyticsResult.error)
      }

      // Load connected accounts
      const accounts = await getMockConnectedAccounts()
      setConnectedAccounts(accounts)

    } catch (error) {
      console.error('Error loading social media data:', error)
      toast.error('Failed to load social media data')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  const refreshPosts = async () => {
    setRefreshing(true)
    await loadPosts()
    setRefreshing(false)
    toast.success('Posts refreshed')
  }

  const handleSearch = (query) => {
    setSearchTerm(query)
  }

  const handleStatusFilter = (status) => {
    setFilterStatus(status)
  }

  const handlePlatformFilter = (platform) => {
    setFilterPlatform(platform)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return CheckCircle
      case 'scheduled':
        return Clock
      case 'draft':
        return AlertCircle
      case 'failed':
        return AlertCircle
      default:
        return Clock
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  // Reload posts when filters change
  useEffect(() => {
    if (!initialLoading) {
      // Reset pagination when filters change
      setPagination(prev => ({ ...prev, page: 1 }))
      loadPosts()
    }
  }, [filterStatus, filterPlatform, searchTerm])

  // Reload posts when pagination changes
  useEffect(() => {
    if (!initialLoading && pagination.page > 1) {
      loadPosts()
    }
  }, [pagination.page])

  if (initialLoading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading social media...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-light text-white mb-2 flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-cyan-400" />
            <span>Social Media</span>
          </h1>
          <p className="text-slate-400 font-light">
            Create, schedule, and manage your social media content
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={refreshPosts}
            disabled={refreshing}
            className="p-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => navigate('/social-media/new')}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Create Post</span>
          </button>
        </div>
      </motion.div>

      {/* Analytics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {[
          { title: 'Total Posts', value: analytics.totalPosts, icon: Share2, color: 'text-cyan-400' },
          { title: 'Scheduled', value: analytics.scheduledPosts, icon: Clock, color: 'text-blue-400' },
          { title: 'Total Reach', value: analytics.totalReach.toLocaleString(), icon: Users, color: 'text-emerald-400' },
          { title: 'Engagement', value: analytics.totalEngagement.toLocaleString(), icon: TrendingUp, color: 'text-orange-400' }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-light mb-2">{stat.title}</p>
                <h3 className="text-2xl font-light text-white">{stat.value}</h3>
              </div>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Connected Accounts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
      >
        <h3 className="text-xl font-light text-white mb-4">Connected Accounts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {connectedAccounts.map((account, index) => (
            <div
              key={account.platform}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center`}>
                  {getPlatformIcon(account.platform)}
                </div>
                <span className="text-emerald-400 text-xs font-medium">
                  {account.status === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-white font-medium text-sm">{account.name}</p>
              <p className="text-slate-400 text-xs">{account.followers} followers</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Search */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="appearance-none bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
              >
                <option value="all" className="bg-slate-800">All Status</option>
                <option value="published" className="bg-slate-800">Published</option>
                <option value="scheduled" className="bg-slate-800">Scheduled</option>
                <option value="draft" className="bg-slate-800">Draft</option>
                <option value="failed" className="bg-slate-800">Failed</option>
              </select>
            </div>

            {/* Platform Filter */}
            <div className="relative">
              <select
                value={filterPlatform}
                onChange={(e) => handlePlatformFilter(e.target.value)}
                className="appearance-none bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
              >
                <option value="all" className="bg-slate-800">All Platforms</option>
                <option value="facebook" className="bg-slate-800">Facebook</option>
                <option value="instagram" className="bg-slate-800">Instagram</option>
                <option value="twitter" className="bg-slate-800">Twitter</option>
                <option value="linkedin" className="bg-slate-800">LinkedIn</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Posts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <Share2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No posts found</h3>
            <p className="text-slate-400 mb-6">
              {searchTerm || filterStatus !== 'all' || filterPlatform !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first social media post to get started'}
            </p>
            {!searchTerm && filterStatus === 'all' && filterPlatform === 'all' && (
              <button
                onClick={() => navigate('/social-media/new')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all duration-200 font-medium"
              >
                Create Your First Post
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-white/10">
              {filteredPosts.map((post, index) => {
                const StatusIcon = getStatusIcon(post.status)
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="p-6 hover:bg-white/5 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-400/20 flex-shrink-0">
                        <Share2 className="w-6 h-6 text-cyan-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="w-4 h-4 text-slate-400" />
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                              {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                                              {post.platforms.map((platform) => (
                    <div
                      key={platform}
                      className={`w-6 h-6 rounded bg-slate-700/50 flex items-center justify-center`}
                    >
                      {getPlatformIcon(platform)}
                    </div>
                  ))}
                          </div>
                        </div>
                        
                        <p className="text-white font-medium mb-2 group-hover:text-cyan-300 transition-colors">
                          {post.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-slate-400 text-sm">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {post.status === 'scheduled' 
                                  ? `Scheduled for ${formatDate(post.scheduledFor)}`
                                  : post.status === 'published'
                                  ? `Published ${formatDate(post.publishedAt)}`
                                  : `Created ${formatDate(post.createdAt)}`
                                }
                              </span>
                            </div>
                          </div>
                          
                          {post.status === 'published' && (
                            <div className="flex items-center space-x-4 text-slate-400 text-sm">
                              <div className="flex items-center space-x-1">
                                <Heart className="w-4 h-4" />
                                <span>{post.engagement.likes}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.engagement.comments}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Repeat2 className="w-4 h-4" />
                                <span>{post.engagement.shares}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-slate-400 text-sm">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} posts
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={!pagination.hasPrevPage}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <span className="text-white text-sm">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={!pagination.hasNextPage}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}

export default SocialMedia 