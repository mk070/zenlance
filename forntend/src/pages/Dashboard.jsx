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
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import AIAnalyticsDashboard from '../components/ai/AIAnalyticsDashboard'

const Dashboard = () => {
  console.log('🚀 Dashboard component is rendering!')
  
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  
  console.log('👤 User:', user)
  console.log('👤 User Profile:', userProfile)
  
  const [stats, setStats] = useState([
    { 
      id: 1, 
      title: 'Total Leads', 
      value: '0', 
      change: '+0%', 
      trend: 'up', 
      icon: Users 
    },
    { 
      id: 2, 
      title: 'Active Clients', 
      value: '0', 
      change: '+0%', 
      trend: 'up', 
      icon: Briefcase 
    },
    { 
      id: 3, 
      title: 'Monthly Revenue', 
      value: '$0', 
      change: '+0%', 
      trend: 'up', 
      icon: DollarSign 
    },
    { 
      id: 4, 
      title: 'Conversion Rate', 
      value: '0%', 
      change: '+0%', 
      trend: 'up', 
      icon: TrendingUp 
    }
  ])

  const [recentProjects] = useState([
    {
      id: 1,
      name: 'Website Redesign',
      client: 'Tech Startup Inc.',
      value: '$5,000',
      deadline: 'Dec 15, 2024',
      status: 'In Progress',
      progress: 75
    },
    {
      id: 2,
      name: 'Mobile App Development',
      client: 'Creative Agency',
      value: '$12,000',
      deadline: 'Jan 20, 2025',
      status: 'Planning',
      progress: 25
    },
    {
      id: 3,
      name: 'Brand Identity',
      client: 'Fashion Brand',
      value: '$3,500',
      deadline: 'Dec 10, 2024',
      status: 'Review',
      progress: 90
    }
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

  useEffect(() => {
    console.log('📊 Dashboard useEffect triggered - loading dashboard data')
    // Load dashboard data when component mounts
    // This would typically fetch from your API
  }, [])

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
                <h3 className="text-2xl font-light text-white">{stat.value}</h3>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
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
            <div className="space-y-4">
              {recentProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-all duration-200 cursor-pointer"
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
            {[
              { goal: 'Revenue Target', current: '$2,500', target: '$5,000', progress: 50 },
              { goal: 'New Clients', current: '2', target: '5', progress: 40 },
              { goal: 'Leads Generated', current: '8', target: '20', progress: 40 }
            ].map((item, index) => (
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
            ))}
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
            {[
              { action: 'New lead added', detail: 'Tech Startup Inc.', time: '2 hours ago', icon: UserPlus },
              { action: 'Invoice sent', detail: '$5,000 to Creative Agency', time: '5 hours ago', icon: FileText },
              { action: 'Project completed', detail: 'Brand Identity for Fashion Brand', time: '1 day ago', icon: CheckCircle }
            ].map((activity, index) => (
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
            ))}
          </div>
        </div>

        {/* AI Analytics Dashboard */}
        <div className="col-span-full">
          <AIAnalyticsDashboard />
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard 