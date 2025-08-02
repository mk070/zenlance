import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Home,
  UserPlus,
  Users, 
  Briefcase,
  FileText,
  CreditCard,
  PieChart,
  Settings,
  Sparkles,
  LogOut
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Layout = ({ children }) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Home, path: '/dashboard' },
    { id: 'leads', label: 'Leads', icon: UserPlus, path: '/leads' },  
    { id: 'clients', label: 'Clients', icon: Users, path: '/clients' },
    { id: 'projects', label: 'Projects', icon: Briefcase, path: '/dashboard' },
    { id: 'invoices', label: 'Invoices', icon: FileText, path: '/dashboard' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/dashboard' },
    { id: 'analytics', label: 'Analytics', icon: PieChart, path: '/dashboard' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ]

  const handleNavigation = (item) => {
    navigate(item.path)
  }

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut()
      navigate('/signin')
    }
  }

  const isActive = (item) => {
    // Only highlight specific main pages when on their exact route
    if (location.pathname === '/dashboard' && item.id === 'overview') {
      return true
    }
    if (location.pathname === '/leads' && item.id === 'leads') {
      return true
    }
    if (location.pathname === '/clients' && item.id === 'clients') {
      return true
    }
    if (location.pathname === '/settings' && item.id === 'settings') {
      return true
    }
    // Dashboard sub-items (projects, invoices, etc.) are not active by default
    // until we implement proper dashboard tabs
    return false
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
          className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col"
        >
          <div className="p-6 flex-1">
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
                  onClick={() => handleNavigation(item)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive(item)
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
          <div className="p-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <span className="text-sm font-medium text-white">
                    {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'User'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <motion.button
                onClick={handleSignOut}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 text-slate-400 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-light">Sign Out</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout 