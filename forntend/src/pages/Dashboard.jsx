import { useState } from 'react'
import { motion } from 'framer-motion'
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
  Sparkles,
  LogOut,
  Home,
  Briefcase,
  FileText,
  CreditCard,
  PieChart,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Dashboard = () => {
  const { user, signOut } = useAuth()
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
      client: 'StartupXYZ',
      status: 'Review',
      progress: 90,
      deadline: '2024-02-10',
      value: '$8,500'
    },
    {
      id: 3,
      name: 'Mobile App UI',
      client: 'InnovateLab',
      status: 'Planning',
      progress: 25,
      deadline: '2024-03-01',
      value: '$12,000'
    }
  ]

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings }
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
    <div className="min-h-screen bg-black text-white">
      {/* Apple-style background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-900" />
        
        {/* Subtle animated orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-1/4 w-96 h-96 bg-gradient-to-r from-navy-600/10 to-slate-600/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-r from-slate-700/8 to-navy-700/8 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10"
        >
          <div className="p-6">
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-10">
              <div className="w-10 h-10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-xl border border-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-light text-white">FreelanceHub</span>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {sidebarItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-light">{item.label}</span>
                </motion.button>
              ))}
            </nav>
          </div>

          {/* User Profile */}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <span className="text-sm font-medium text-white">
                    {user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-light">Sign Out</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
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
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-64 h-10 pl-10 pr-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-slate-400 font-light focus:bg-white/10 focus:border-white/40 focus:outline-none transition-all duration-300"
                  />
                </div>

                {/* Notifications */}
                <button className="relative p-2 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-200">
                  <Bell className="w-5 h-5 text-slate-400" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                </button>

                {/* Add Project */}
                <button className="flex items-center space-x-2 px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all duration-200">
                  <Plus className="w-4 h-4" />
                  <span>New Project</span>
                </button>
              </div>
            </div>
          </motion.header>

          {/* Dashboard Content */}
          <div className="flex-1 overflow-auto p-8">
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 bg-gradient-to-br ${stat.color} bg-opacity-20 rounded-xl`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className={`flex items-center space-x-1 text-sm ${
                      stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      <span className="font-light">{stat.change}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-light text-white mb-1">{stat.value}</p>
                    <p className="text-sm text-slate-400 font-light">{stat.title}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Projects */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
              >
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-light text-white">Recent Projects</h3>
                    <button className="text-slate-400 hover:text-white transition-colors duration-200">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {recentProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-white mb-1">{project.name}</h4>
                          <p className="text-sm text-slate-400 font-light">{project.client}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{project.value}</p>
                          <span className={`inline-block px-2 py-1 text-xs font-light rounded-full border ${getStatusColor(project.status)}`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400 font-light">Progress</span>
                          <span className="text-white font-light">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 font-light">Due: {project.deadline}</span>
                        <button className="text-blue-400 hover:text-blue-300 font-light transition-colors duration-200">
                          View Details
                        </button>
                      </div>
                    </motion.div>
                  ))}
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
                    { icon: Plus, label: 'New Project', color: 'from-blue-400 to-cyan-500' },
                    { icon: Users, label: 'Add Client', color: 'from-purple-400 to-pink-500' },
                    { icon: FileText, label: 'Create Invoice', color: 'from-emerald-400 to-teal-500' },
                    { icon: Calendar, label: 'Schedule Meeting', color: 'from-orange-400 to-red-500' }
                  ].map((action, index) => (
                    <motion.button
                      key={action.label}
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
      </div>
    </div>
  )
}

export default Dashboard 