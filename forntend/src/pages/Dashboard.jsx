import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Settings, 
  Bell, 
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  UserPlus,
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')

  const stats = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: '$24,580',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'from-emerald-400 to-teal-500'
    },
    {
      id: 'projects',
      title: 'Active Projects',
      value: '18',
      change: '+3',
      trend: 'up',
      icon: Briefcase,
      color: 'from-blue-400 to-cyan-500'
    },
    {
      id: 'clients',
      title: 'Total Clients',
      value: '42',
      change: '+8',
      trend: 'up',
      icon: Users,
      color: 'from-purple-400 to-pink-500'
    },
    {
      id: 'hours',
      title: 'Hours This Month',
      value: '156',
      change: '-12',
      trend: 'down',
      icon: Clock,
      color: 'from-orange-400 to-red-500'
    }
  ]

  const recentProjects = [
    {
      id: 1,
      name: 'Brand Identity Design',
      client: 'TechCorp Inc.',
      status: 'In Progress',
      progress: 75,
      deadline: '2024-02-15',
      value: '$5,200'
    },
    {
      id: 2,
      name: 'Website Redesign',
      client: 'StartupCo',
      status: 'Review',
      progress: 90,
      deadline: '2024-02-10',
      value: '$8,500'
    },
    {
      id: 3,
      name: 'Mobile App UI',
      client: 'InnovateLabs',
      status: 'Planning',
      progress: 25,
      deadline: '2024-03-01',
      value: '$12,000'
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'Review': return 'text-orange-400 bg-orange-400/10 border-orange-400/20'
      case 'Planning': return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
      case 'Completed': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-8 py-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-white mb-1">Good morning! 👋</h1>
            <p className="text-slate-400 font-light">Here's what's happening with your business today.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-80 pl-10 pr-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
              />
            </div>
            
            <button className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200">
              <Bell className="w-5 h-5" />
            </button>
            
            <button className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all duration-200">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Stats Grid */}
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
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-slate-400 text-sm font-light mb-2">{stat.title}</p>
                  <div className="flex items-end space-x-2">
                    <h3 className="text-2xl font-light text-white">{stat.value}</h3>
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
                  </div>
                </div>
                <div className={`p-3 bg-gradient-to-br ${stat.color} bg-opacity-20 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-light text-white">Recent Projects</h3>
                <button className="text-slate-400 hover:text-white transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-200"
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-400 to-cyan-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-10 text-right">{project.progress}%</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
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
                { icon: UserPlus, label: 'Add Lead', color: 'from-blue-400 to-cyan-500', action: () => navigate('/leads') },
                { icon: Users, label: 'Add Client', color: 'from-purple-400 to-pink-500', action: () => navigate('/clients') },
                { icon: Plus, label: 'New Project', color: 'from-emerald-400 to-teal-500', action: () => {} },
                { icon: FileText, label: 'Create Invoice', color: 'from-orange-400 to-red-500', action: () => {} }
              ].map((action, index) => (
                <motion.button
                  key={action.label}
                  onClick={action.action}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className={`inline-flex p-3 bg-gradient-to-br ${action.color} bg-opacity-20 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-light text-white">{action.label}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 