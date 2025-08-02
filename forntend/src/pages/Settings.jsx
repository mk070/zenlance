import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Globe, 
  Palette, 
  Download,
  Trash2,
  Key,
  Mail,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  Building2,
  HelpCircle,
  FileText,
  Database,
  LogOut,
  ChevronRight,
  Save,
  AlertTriangle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const Settings = () => {
  const { user, userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('account')
  const [loading, setLoading] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Settings state
  const [settings, setSettings] = useState({
    // Account Settings
    emailNotifications: true,
    marketingEmails: false,
    twoFactorEnabled: false,
    
    // Notification Settings
    projectUpdates: true,
    clientMessages: true,
    paymentReminders: true,
    weeklyReports: true,
    
    // Business Settings
    automaticInvoicing: false,
    invoiceReminders: true,
    clientPortalAccess: true,
    projectTemplates: true,
    
    // Privacy Settings
    profileVisibility: 'private',
    dataSharing: false,
    analyticsTracking: true,
    
    // Appearance Settings
    theme: 'dark',
    language: 'en',
    timezone: 'UTC'
  })

  useEffect(() => {
    // Load user settings from profile or API
    if (userProfile?.settings) {
      setSettings(prev => ({
        ...prev,
        ...userProfile.settings
      }))
    }
  }, [userProfile])

  const settingSections = [
    { 
      id: 'account', 
      label: 'Account Settings', 
      icon: User,
      description: 'Personal information and account preferences'
    },
    { 
      id: 'security', 
      label: 'Security & Privacy', 
      icon: Shield,
      description: 'Password, 2FA, and privacy settings'
    },
    { 
      id: 'notifications', 
      label: 'Notifications', 
      icon: Bell,
      description: 'Email and push notification preferences'
    },
    { 
      id: 'business', 
      label: 'Business Settings', 
      icon: Building2,
      description: 'Invoice, client, and project settings'
    },
    { 
      id: 'billing', 
      label: 'Billing & Plans', 
      icon: CreditCard,
      description: 'Subscription and payment methods'
    },
    { 
      id: 'data', 
      label: 'Data & Privacy', 
      icon: Database,
      description: 'Export data and account deletion'
    }
  ]

  const handleSettingChange = async (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }))

    // Auto-save setting
    try {
      await apiClient.updateProfileSettings({ [setting]: value })
      toast.success('Setting updated')
    } catch (error) {
      console.error('Error updating setting:', error)
      toast.error('Failed to update setting')
      // Revert on error
      setSettings(prev => ({
        ...prev,
        [setting]: !value
      }))
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      setLoading(true)
      const result = await apiClient.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      if (result.success) {
        toast.success('Password updated successfully')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setShowPasswordForm(false)
      } else {
        toast.error(result.error || 'Failed to update password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      setLoading(true)
      const result = await apiClient.exportUserData()
      
      if (result.success) {
        // Create download link
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `freelancehub-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast.success('Data exported successfully')
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'This action cannot be undone. Type "DELETE" to confirm account deletion:'
    )
    
    if (confirmation !== 'DELETE') {
      return
    }

    try {
      setLoading(true)
      const result = await apiClient.deleteAccount()
      
      if (result.success) {
        toast.success('Account deleted successfully')
        await signOut()
        navigate('/signin')
      } else {
        toast.error(result.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const ToggleSwitch = ({ enabled, onChange, disabled = false }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 ${
        enabled ? 'bg-white' : 'bg-white/20'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform duration-200 ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )

  const renderAccountSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h4 className="text-lg font-medium text-white mb-4">Profile Information</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <p className="text-white font-medium">Edit Profile</p>
              <p className="text-sm text-slate-400">Update your personal and business information</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2 text-white hover:text-slate-300 transition-colors"
            >
              <span>Edit</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white font-medium">Email Address</p>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
            <span className="text-xs text-slate-500 px-2 py-1 bg-white/10 rounded-full">Verified</span>
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h4 className="text-lg font-medium text-white mb-4">Preferences</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Email Notifications</p>
              <p className="text-sm text-slate-400">Receive notifications via email</p>
            </div>
            <ToggleSwitch
              enabled={settings.emailNotifications}
              onChange={(value) => handleSettingChange('emailNotifications', value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Marketing Emails</p>
              <p className="text-sm text-slate-400">Receive product updates and tips</p>
            </div>
            <ToggleSwitch
              enabled={settings.marketingEmails}
              onChange={(value) => handleSettingChange('marketingEmails', value)}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h4 className="text-lg font-medium text-white mb-4">Password & Security</h4>
        
        {!showPasswordForm ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-white/10">
              <div>
                <p className="text-white font-medium">Change Password</p>
                <p className="text-sm text-slate-400">Update your account password</p>
              </div>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="flex items-center space-x-2 text-white hover:text-slate-300 transition-colors"
              >
                <Key className="w-4 h-4" />
                <span>Change</span>
              </button>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-slate-400">Add an extra layer of security</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-orange-400 px-2 py-1 bg-orange-400/10 rounded-full">Coming Soon</span>
                <ToggleSwitch
                  enabled={settings.twoFactorEnabled}
                  onChange={(value) => handleSettingChange('twoFactorEnabled', value)}
                  disabled={true}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-white font-medium">Change Password</h5>
              <button
                onClick={() => setShowPasswordForm(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button
              onClick={handlePasswordChange}
              disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>{loading ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h4 className="text-lg font-medium text-white mb-4">Email Notifications</h4>
        <div className="space-y-4">
          {[
            { key: 'projectUpdates', label: 'Project Updates', desc: 'Status changes and milestones' },
            { key: 'clientMessages', label: 'Client Messages', desc: 'New messages from clients' },
            { key: 'paymentReminders', label: 'Payment Reminders', desc: 'Overdue invoices and payments' },
            { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Summary of your activity' }
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{label}</p>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
              <ToggleSwitch
                enabled={settings[key]}
                onChange={(value) => handleSettingChange(key, value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h4 className="text-lg font-medium text-white mb-4">Business Automation</h4>
        <div className="space-y-4">
          {[
            { key: 'automaticInvoicing', label: 'Automatic Invoicing', desc: 'Generate invoices automatically' },
            { key: 'invoiceReminders', label: 'Invoice Reminders', desc: 'Send payment reminders to clients' },
            { key: 'clientPortalAccess', label: 'Client Portal', desc: 'Allow clients to access project portal' },
            { key: 'projectTemplates', label: 'Project Templates', desc: 'Use templates for new projects' }
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{label}</p>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
              <ToggleSwitch
                enabled={settings[key]}
                onChange={(value) => handleSettingChange(key, value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderBillingSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h4 className="text-lg font-medium text-white mb-4">Current Plan</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <p className="text-white font-medium">Free Plan</p>
              <p className="text-sm text-slate-400">Basic features for small teams</p>
            </div>
            <span className="text-xs text-green-400 px-2 py-1 bg-green-400/10 rounded-full">Active</span>
          </div>
          
          <div className="py-3">
            <p className="text-slate-400 text-sm">
              Upgrade to Pro for advanced features, unlimited projects, and priority support.
            </p>
          </div>
          
          <button className="w-full py-3 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all duration-200">
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  )

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h4 className="text-lg font-medium text-white mb-4">Data Management</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-white/10">
            <div>
              <p className="text-white font-medium">Export Your Data</p>
              <p className="text-sm text-slate-400">Download all your data in JSON format</p>
            </div>
            <button
              onClick={handleExportData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 text-white disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
          
          <div className="py-3">
            <div className="flex items-center space-x-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-white font-medium">Danger Zone</p>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl transition-all duration-200 text-red-400 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'account': return renderAccountSettings()
      case 'security': return renderSecuritySettings()
      case 'notifications': return renderNotificationSettings()
      case 'business': return renderBusinessSettings()
      case 'billing': return renderBillingSettings()
      case 'data': return renderDataSettings()
      default: return renderAccountSettings()
    }
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-gray-800/50 bg-black/40 backdrop-blur-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-white mb-2">Settings</h1>
              <p className="text-slate-400 font-light">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 border-r border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="p-6">
            <nav className="space-y-2">
              {settingSections.map((section, index) => (
                <motion.button
                  key={section.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                    activeSection === section.id
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <section.icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{section.label}</p>
                    <p className="text-xs text-slate-500 truncate">{section.description}</p>
                  </div>
                </motion.button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Settings 