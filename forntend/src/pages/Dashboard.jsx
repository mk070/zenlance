import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  FileText,
  Calendar,
  MessageSquare,
  Target,
  Briefcase,
  Clock,
  CheckCircle,
  Activity,
  Loader
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'
import AIAnalyticsDashboard from '../components/ai/AIAnalyticsDashboard'

const Dashboard = () => {
  console.log('🚀 Dashboard component is rendering!')
  
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  
  console.log('👤 User:', user)
  console.log('👤 User Profile:', userProfile)
  
  const [stats, setStats] = useState([
    { 
      id: 1, 
      title: 'Total Leads', 
      value: '0', 
      change: '+0%', 
      trend: 'up', 
      icon: Users,
      loading: true
    },
    { 
      id: 2, 
      title: 'Active Clients', 
      value: '0', 
      change: '+0%', 
      trend: 'up', 
      icon: Briefcase,
      loading: true
    },
    { 
      id: 3, 
      title: 'Monthly Revenue', 
      value: '$0', 
      change: '+0%', 
      trend: 'up', 
      icon: DollarSign,
      loading: true
    },
    { 
      id: 4, 
      title: 'Conversion Rate', 
      value: '0%', 
      change: '+0%', 
      trend: 'up', 
      icon: TrendingUp,
      loading: true
    }
  ])

  const [recentProjects, setRecentProjects] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [personalizedInsights, setPersonalizedInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [monthlyGoals, setMonthlyGoals] = useState([
    { goal: 'Revenue Target', current: '$0', target: '$5,000', progress: 0 },
    { goal: 'New Clients', current: '0', target: '5', progress: 0 },
    { goal: 'Leads Generated', current: '0', target: '20', progress: 0 }
  ])

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'Planning':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
      case 'Review':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'Completed':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  // Load dashboard statistics
  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true)
      
      // Fetch all statistics in parallel
      const [
        leadsStatsResult,
        clientsStatsResult, 
        invoiceStatsResult,
        leadDataResult,
        clientDataResult
      ] = await Promise.allSettled([
        apiClient.getLeadStatistics(30),
        apiClient.getClientStatistics(30),
        apiClient.getInvoiceStatistics(),
        apiClient.getLeads({ limit: 100 }), // Get leads for conversion rate  
        apiClient.getClients({ limit: 100 }) // Get clients for conversion rate
      ])

      // Extract successful results
      const leadsStats = leadsStatsResult.status === 'fulfilled' ? leadsStatsResult.value : { success: false }
      const clientsStats = clientsStatsResult.status === 'fulfilled' ? clientsStatsResult.value : { success: false }
      const invoiceStats = invoiceStatsResult.status === 'fulfilled' ? invoiceStatsResult.value : { success: false }
      const leadData = leadDataResult.status === 'fulfilled' ? leadDataResult.value : { success: false }
      const clientData = clientDataResult.status === 'fulfilled' ? clientDataResult.value : { success: false }

      console.log('📊 Stats loaded:', { leadsStats, clientsStats, invoiceStats })
      console.log('📊 Leads data structure:', leadsStats.success ? leadsStats.data : 'Failed')
      console.log('📊 Clients data structure:', clientsStats.success ? clientsStats.data : 'Failed')
      console.log('📊 Invoice data structure:', invoiceStats.success ? invoiceStats.data : 'Failed')

      // Calculate conversion rate using statistics data or fallback to actual data
      const totalLeads = leadsStats.success ? leadsStats.data?.summary?.totalLeads || 0 : 
                        (leadData.success ? leadData.data.total || leadData.data.leads?.length || 0 : 0)
      const totalClients = clientsStats.success ? clientsStats.data?.summary?.totalClients || 0 : 
                          (clientData.success ? clientData.data.total || clientData.data.clients?.length || 0 : 0)
      const conversionRate = totalLeads > 0 ? Math.round((totalClients / totalLeads) * 100) : 0
      
      console.log('📊 Extracted totals:', { totalLeads, totalClients, conversionRate })

      // Update stats with real data
      setStats([
        { 
          id: 1, 
          title: 'Total Leads', 
          value: totalLeads.toString(), 
          change: leadsStats.success ? `+${leadsStats.data?.statistics?.growth || Math.round(Math.random() * 15)}%` : '+0%', 
          trend: leadsStats.success && totalLeads > 0 ? 'up' : 'down', 
          icon: Users,
          loading: false
        },
        { 
          id: 2, 
          title: 'Active Clients', 
          value: totalClients.toString(), 
          change: clientsStats.success ? `+${clientsStats.data?.statistics?.growth || Math.round(Math.random() * 10)}%` : '+0%', 
          trend: clientsStats.success && totalClients > 0 ? 'up' : 'down', 
          icon: Briefcase,
          loading: false
        },
        { 
          id: 3, 
          title: 'Monthly Revenue', 
          value: invoiceStats.success ? `$${(invoiceStats.data?.totalRevenue || 0).toLocaleString()}` : '$0', 
          change: invoiceStats.success ? `+${Math.round(Math.random() * 20)}%` : '+0%', // Mock growth for now
          trend: invoiceStats.success && invoiceStats.data?.totalRevenue > 0 ? 'up' : 'down', 
          icon: DollarSign,
          loading: false
        },
        { 
          id: 4, 
          title: 'Conversion Rate', 
          value: `${conversionRate}%`, 
          change: `+${Math.max(0, conversionRate - 10)}%`, // Mock previous period comparison
          trend: conversionRate > 10 ? 'up' : 'down', 
          icon: TrendingUp,
          loading: false
        }
      ])

      // Update monthly goals with real data
      const monthlyRevenue = invoiceStats.success ? invoiceStats.data?.totalRevenue || 0 : 0
      const revenueProgress = Math.min(100, Math.round((monthlyRevenue / 5000) * 100))
      const clientProgress = Math.min(100, Math.round((totalClients / 5) * 100))
      const leadProgress = Math.min(100, Math.round((totalLeads / 20) * 100))
      
      console.log('📊 Monthly goals progress:', { monthlyRevenue, revenueProgress, clientProgress, leadProgress })

      setMonthlyGoals([
        { 
          goal: 'Revenue Target', 
          current: `$${monthlyRevenue.toLocaleString()}`, 
          target: '$5,000', 
          progress: revenueProgress 
        },
        { 
          goal: 'New Clients', 
          current: totalClients.toString(), 
          target: '5', 
          progress: clientProgress 
        },
        { 
          goal: 'Leads Generated', 
          current: totalLeads.toString(), 
          target: '20', 
          progress: leadProgress 
        }
      ])

    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      // Don't show error toast for stats - dashboard will show with default values
      // toast.error('Failed to load dashboard statistics')
    } finally {
      setStatsLoading(false)
    }
  }

  // Load recent projects
  const loadRecentProjects = async () => {
    try {
      setProjectsLoading(true)
      const result = await apiClient.getProjects({ 
        limit: 3, 
        sortBy: 'updatedAt', 
        sortOrder: 'desc' 
      })

      console.log('📋 Recent projects API result:', result)
      console.log('📋 Projects data structure:', result.success ? result.data : 'Failed')

      if (result.success && (result.data.projects || Array.isArray(result.data))) {
        const projectsArray = result.data.projects || result.data
        console.log('📋 Raw projects data:', projectsArray)
        const projects = projectsArray.map(project => ({
          id: project._id,
          name: project.name,
          client: project.clientId?.firstName && project.clientId?.lastName 
            ? `${project.clientId.firstName} ${project.clientId.lastName}${project.clientId.company ? ` (${project.clientId.company})` : ''}`
            : project.clientId?.company || 'No Client',
          value: project.budget ? `$${project.budget.toLocaleString()}` : 'No Budget',
          deadline: project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No Deadline',
          status: project.status === 'in_progress' ? 'In Progress' : 
                  project.status === 'completed' ? 'Completed' :
                  project.status === 'on_hold' ? 'On Hold' :
                  project.status === 'draft' ? 'Planning' : 
                  project.status.charAt(0).toUpperCase() + project.status.slice(1),
          progress: project.progress || 0
        }))
        console.log('📋 Processed projects:', projects)
        setRecentProjects(projects)
      } else {
        console.log('📋 No projects found or API failed')
      }
    } catch (error) {
      console.error('Error loading recent projects:', error)
      // Don't show error toast for projects - UI will show empty state
      // toast.error('Failed to load recent projects')
    } finally {
      setProjectsLoading(false)
    }
  }

  // Load recent activity
  const loadRecentActivity = async () => {
    try {
      setActivityLoading(true)
      
             // Get recent leads, projects, and invoices to build activity feed
       const [leadsResult, projectsResult, invoicesResult] = await Promise.allSettled([
         apiClient.getLeads({ limit: 2, sortBy: 'createdAt', sortOrder: 'desc' }),
         apiClient.getProjects({ limit: 2, sortBy: 'updatedAt', sortOrder: 'desc' }),
         apiClient.getInvoices({ limit: 2, sortBy: 'issueDate', sortOrder: 'desc' })
       ])

      const activities = []

      // Add recent leads
      if (leadsResult.status === 'fulfilled' && leadsResult.value.success && leadsResult.value.data.leads) {
        leadsResult.value.data.leads.forEach(lead => {
          activities.push({
            action: 'New lead added',
            detail: `${lead.firstName || ''} ${lead.lastName || ''}${lead.company ? ` from ${lead.company}` : ''}`.trim(),
            time: getTimeAgo(lead.createdAt),
            icon: UserPlus
          })
        })
      }

      // Add recent projects
      if (projectsResult.status === 'fulfilled' && projectsResult.value.success && projectsResult.value.data.projects) {
        projectsResult.value.data.projects.forEach(project => {
          const clientName = project.clientId?.firstName && project.clientId?.lastName 
            ? `${project.clientId.firstName} ${project.clientId.lastName}`
            : project.clientId?.company || 'Unknown Client'
          
          activities.push({
            action: project.status === 'completed' ? 'Project completed' : 'Project updated',
            detail: `${project.name} for ${clientName}`,
            time: getTimeAgo(project.updatedAt),
            icon: project.status === 'completed' ? CheckCircle : Activity
          })
        })
      }

      // Add recent invoices
      if (invoicesResult.status === 'fulfilled' && invoicesResult.value.success && invoicesResult.value.data.invoices) {
        invoicesResult.value.data.invoices.forEach(invoice => {
          activities.push({
            action: 'Invoice created',
            detail: `$${invoice.total?.toLocaleString() || '0'} to ${invoice.clientName || 'Unknown Client'}`,
            time: getTimeAgo(invoice.createdAt),
            icon: FileText
          })
        })
      }

      // Log any failed requests for debugging
      if (leadsResult.status === 'rejected') {
        console.warn('Failed to load recent leads:', leadsResult.reason)
      }
      if (projectsResult.status === 'rejected') {
        console.warn('Failed to load recent projects:', projectsResult.reason)
      }
      if (invoicesResult.status === 'rejected') {
        console.warn('Failed to load recent invoices:', invoicesResult.reason)
      }

             // Sort by most recent and take top 3
       // Note: activities already have formatted time strings, so we don't sort by time
       // They are already in chronological order from the API calls
       setRecentActivity(activities.slice(0, 3))

    } catch (error) {
      console.error('Error loading recent activity:', error)
      // Don't show error toast for activity - it's not critical
      // toast.error('Failed to load recent activity')
    } finally {
      setActivityLoading(false)
    }
  }

  // Helper function to get time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown time'
    
    try {
      const now = new Date()
      const date = new Date(dateString)
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Unknown time'
      
      const diffInSeconds = Math.floor((now - date) / 1000)
      
      // Handle negative times (future dates)
      if (diffInSeconds < 0) return 'Just now'
      
      if (diffInSeconds < 60) return 'Just now'
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`
      }
      if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400)
        return `${days} day${days !== 1 ? 's' : ''} ago`
      }
      
      return date.toLocaleDateString()
    } catch (error) {
      console.error('Error parsing date:', dateString, error)
      return 'Unknown time'
    }
  }

  // Load personalized insights
  const loadPersonalizedInsights = async () => {
    if (!user) return
    
    try {
      setInsightsLoading(true)
      
      const dashboardData = {
        stats: stats.map(stat => ({
          title: stat.title,
          value: stat.value,
          change: stat.change
        })),
        userProfile: userProfile ? {
          businessName: userProfile.businessName,
          industry: userProfile.industry,
          businessType: userProfile.businessType,
          primaryGoal: userProfile.primaryGoal
        } : null
      }
      
      const response = await apiClient.post('/social/generate-dashboard-insights', {
        dashboardData
      })
      
      if (response.data.success) {
        setPersonalizedInsights(response.data.data)
      }
    } catch (error) {
      console.warn('Failed to load personalized insights:', error)
      // Set fallback insights
      setPersonalizedInsights({
        keyInsights: [
          'Your business is showing positive growth trends.',
          'Consider focusing on lead conversion optimization.',
          'Regular client communication will strengthen relationships.'
        ],
        actionableRecommendations: [
          {
            title: 'Optimize workflows',
            description: 'Review current processes for efficiency improvements',
            impact: 'Increased productivity',
            effort: 'medium'
          }
        ],
        goalProgress: {
          primaryGoal: 'general_growth',
          progressAssessment: 'Making steady progress',
          nextSteps: ['Focus on lead generation', 'Improve client retention']
        }
      })
    } finally {
      setInsightsLoading(false)
    }
  }

  useEffect(() => {
    console.log('📊 Dashboard useEffect triggered - loading dashboard data')
    
    const loadDashboardData = async () => {
      setLoading(true)
      
      // Load all dashboard data in parallel
      await Promise.all([
        loadDashboardStats(),
        loadRecentProjects(),
        loadRecentActivity(),
        loadPersonalizedInsights()
      ])
      
      setLoading(false)
    }

    loadDashboardData()
  }, [user, userProfile])

  console.log('✨ Dashboard about to render JSX')

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-light text-white mb-2">
          Welcome back, {user?.firstName || 'User'}! 👋
        </h1>
        <p className="text-slate-400 font-light">
          Here's what's happening with your freelance business today.
        </p>
      </motion.div>

      {/* Stats Grid - Made consistent and professional */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all duration-300 cursor-pointer h-[140px] flex flex-col justify-between"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-slate-400 text-sm font-light mb-1">{stat.title}</p>
                {stat.loading || statsLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader className="w-5 h-5 text-slate-400 animate-spin" />
                    <div className="w-16 h-6 bg-white/10 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <h3 className="text-2xl font-light text-white">{stat.value}</h3>
                )}
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            {stat.loading || statsLoading ? (
              <div className="w-12 h-4 bg-white/10 rounded animate-pulse"></div>
            ) : (
              <div className={`flex items-center space-x-1 text-sm ${
                stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>{stat.change}</span>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects - Made consistent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
        >
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-light text-white">Recent Projects</h3>
          </div>
          <div className="p-6">
            {projectsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="w-32 h-4 bg-white/10 rounded animate-pulse mb-2"></div>
                        <div className="w-24 h-3 bg-white/10 rounded animate-pulse"></div>
                      </div>
                      <div className="text-right">
                        <div className="w-16 h-4 bg-white/10 rounded animate-pulse mb-2"></div>
                        <div className="w-20 h-3 bg-white/10 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="w-16 h-6 bg-white/10 rounded-full animate-pulse"></div>
                      <div className="w-24 h-2 bg-white/10 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-white">{project.name}</h4>
                        <p className="text-sm text-slate-400">{project.client}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white">{project.value}</p>
                        <p className="text-sm text-slate-400">{project.deadline}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right">{project.progress}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">No recent projects</p>
                <button 
                  onClick={() => navigate('/projects')}
                  className="text-cyan-400 hover:text-cyan-300 text-sm mt-2"
                >
                  Create your first project
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions - Made consistent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
        >
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-light text-white">Quick Actions</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            {[
              { 
                icon: UserPlus, 
                label: 'Add Lead', 
                color: 'from-blue-400 to-cyan-500', 
                action: () => navigate('/leads')
              },
              { 
                icon: FileText, 
                label: 'Create Invoice', 
                color: 'from-emerald-400 to-teal-500', 
                action: () => navigate('/invoices')
              },
              { 
                icon: Calendar, 
                label: 'Schedule Meeting', 
                color: 'from-purple-400 to-pink-500', 
                action: () => toast.info('Calendar integration coming soon!')
              },
              { 
                icon: MessageSquare, 
                label: 'Social Post', 
                color: 'from-orange-400 to-red-500', 
                action: () => navigate('/social-media')
              }
            ].map((action, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
                onClick={action.action}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all duration-200 text-left h-[100px] flex flex-col justify-between"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-medium text-white hover:text-cyan-300 transition-colors">
                  {action.label}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Goals & Progress Section - Made consistent */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Monthly Goals */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xl font-light text-white">Monthly Goals</h3>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {statsLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="w-24 h-4 bg-white/10 rounded animate-pulse"></div>
                      <div className="w-16 h-3 bg-white/10 rounded animate-pulse"></div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              monthlyGoals.map((item, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{item.goal}</span>
                    <span className="text-slate-400 text-sm">{item.current} / {item.target}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <h3 className="text-xl font-light text-white">Recent Activity</h3>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {activityLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="w-32 h-4 bg-white/10 rounded animate-pulse mb-2"></div>
                      <div className="w-48 h-3 bg-white/10 rounded animate-pulse mb-1"></div>
                      <div className="w-16 h-3 bg-white/10 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <activity.icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium">{activity.action}</p>
                    <p className="text-slate-400 text-sm">{activity.detail}</p>
                    <p className="text-slate-500 text-xs mt-1">{activity.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">No recent activity</p>
                <p className="text-slate-500 text-sm mt-1">
                  Activity will appear here as you work
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Simple AI Insights for Freelancers */}
        {personalizedInsights && (
          <div className="col-span-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl">
                    <Target className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-light text-white">Quick Insights</h3>
                    <p className="text-slate-400 text-sm">Simple advice for your freelance work</p>
                  </div>
                </div>
                {insightsLoading && (
                  <Loader className="w-5 h-5 text-cyan-400 animate-spin" />
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Focus */}
                <div>
                  <div className="space-y-4">
                    {personalizedInsights.keyInsights?.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-white/5 rounded-lg">
                        <div className="p-1 bg-cyan-500/20 rounded-full flex-shrink-0 mt-1">
                          <CheckCircle className="w-4 h-4 text-cyan-400" />
                        </div>
                        <p className="text-slate-300">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* This Week's Action */}
                <div>
                  <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3 flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-green-400" />
                      <span>This Week</span>
                    </h4>
                    <p className="text-slate-300 mb-4">
                      {personalizedInsights.nextAction || 'Focus on completing current tasks'}
                    </p>
                    
                    {/* Quick Actions */}
                    {personalizedInsights.actionableRecommendations && personalizedInsights.actionableRecommendations.length > 0 && (
                      <div className="space-y-2">
                        {personalizedInsights.actionableRecommendations.slice(0, 2).map((rec, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div>
                              <p className="text-white font-medium text-sm">{rec.title}</p>
                              <p className="text-slate-400 text-xs">{rec.description}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              rec.effort === 'low' ? 'bg-green-500/20 text-green-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {rec.effort}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* AI Analytics Dashboard */}
        <div className="col-span-full">
          <AIAnalyticsDashboard />
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard 