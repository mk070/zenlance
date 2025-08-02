import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  FileText, 
  Share2, 
  Settings, 
  User, 
  LogOut,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const sidebarItems = [
    { 
      id: 'dashboard', 
      label: 'Overview', 
      icon: LayoutDashboard, 
      path: '/dashboard'
    },
    { 
      id: 'leads', 
      label: 'Leads', 
      icon: Users, 
      path: '/leads'
    },
    { 
      id: 'clients', 
      label: 'Clients', 
      icon: UserCheck, 
      path: '/clients'
    },
    { 
      id: 'invoices', 
      label: 'Invoices', 
      icon: FileText, 
      path: '/invoices'
    },
    { 
      id: 'social', 
      label: 'Social Media', 
      icon: Share2, 
      path: '/social-media'
    }
  ]

  const bottomItems = [
    { 
      id: 'profile', 
      label: 'Profile', 
      icon: User, 
      path: '/profile'
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings, 
      path: '/settings'
    }
  ]

  const isActive = (path) => {
    // For exact matches
    if (location.pathname === path) {
      return true
    }
    
    // For nested routes, don't highlight parent
    if (path === '/dashboard' && location.pathname !== '/dashboard') {
      return false
    }
    
    return false
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/signin')
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
        {/* Sidebar - Redesigned */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col"
        >
          {/* Logo Section */}
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-xl rounded-xl border border-cyan-400/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xl font-light text-white">FreelanceHub</span>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="flex-1 px-6">
            <nav className="space-y-1">
              {sidebarItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive(item.path)
                      ? 'bg-cyan-400/10 text-white border border-cyan-400/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${
                    isActive(item.path) ? 'text-cyan-400' : 'group-hover:text-cyan-400'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              ))}
            </nav>
          </div>

          {/* Bottom Section */}
          <div className="p-6 border-t border-white/10 space-y-4">
            {/* Bottom navigation items */}
            <div className="space-y-1">
              {bottomItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive(item.path)
                      ? 'bg-cyan-400/10 text-white border border-cyan-400/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className={`w-5 h-5 transition-colors ${
                    isActive(item.path) ? 'text-cyan-400' : 'group-hover:text-cyan-400'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {/* User profile card */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-400/20">
                  <User className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-slate-400 text-xs truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all duration-200"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout 