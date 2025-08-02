import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Briefcase, 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Settings,
  Camera,
  Save,
  X,
  Edit3,
  Globe,
  Award,
  Calendar
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const Profile = () => {
  const { user, userProfile, setUserProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: {
      city: '',
      country: '',
      timezone: ''
    },
    
    // Business Information
    businessName: '',
    businessType: '',
    industry: '',
    teamSize: '',
    primaryGoal: '',
    experienceLevel: '',
    monthlyRevenue: '',
    currentTools: [],
    
    // Professional Details
    bio: '',
    website: '',
    linkedIn: '',
    yearsOfExperience: ''
  })

  // Initialize form data
  useEffect(() => {
    if (user && userProfile) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: userProfile.phone || '',
        location: {
          city: userProfile.location?.city || '',
          country: userProfile.location?.country || '',
          timezone: userProfile.location?.timezone || ''
        },
        businessName: userProfile.businessName || '',
        businessType: userProfile.businessType || '',
        industry: userProfile.industry || '',
        teamSize: userProfile.teamSize || '',
        primaryGoal: userProfile.primaryGoal || '',
        experienceLevel: userProfile.experienceLevel || '',
        monthlyRevenue: userProfile.monthlyRevenue || '',
        currentTools: userProfile.currentTools || [],
        bio: userProfile.bio || '',
        website: userProfile.website || '',
        linkedIn: userProfile.linkedIn || '',
        yearsOfExperience: userProfile.yearsOfExperience || ''
      })
    }
  }, [user, userProfile])

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleToolsChange = (value) => {
    const tools = value.split(',').map(tool => tool.trim()).filter(tool => tool)
    setFormData(prev => ({
      ...prev,
      currentTools: tools
    }))
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Prepare data for API
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        location: formData.location,
        businessName: formData.businessName,
        businessType: formData.businessType,
        industry: formData.industry,
        teamSize: formData.teamSize,
        primaryGoal: formData.primaryGoal,
        experienceLevel: formData.experienceLevel,
        monthlyRevenue: formData.monthlyRevenue,
        currentTools: formData.currentTools,
        bio: formData.bio,
        website: formData.website,
        linkedIn: formData.linkedIn,
        yearsOfExperience: formData.yearsOfExperience
      }

      const result = await apiClient.updateUserProfile(profileData)
      
      if (result.success) {
        setUserProfile(result.data.profile)
        setIsEditing(false)
        toast.success('Profile updated successfully!')
      } else {
        toast.error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original values
    if (user && userProfile) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: userProfile.phone || '',
        location: {
          city: userProfile.location?.city || '',
          country: userProfile.location?.country || '',
          timezone: userProfile.location?.timezone || ''
        },
        businessName: userProfile.businessName || '',
        businessType: userProfile.businessType || '',
        industry: userProfile.industry || '',
        teamSize: userProfile.teamSize || '',
        primaryGoal: userProfile.primaryGoal || '',
        experienceLevel: userProfile.experienceLevel || '',
        monthlyRevenue: userProfile.monthlyRevenue || '',
        currentTools: userProfile.currentTools || [],
        bio: userProfile.bio || '',
        website: userProfile.website || '',
        linkedIn: userProfile.linkedIn || '',
        yearsOfExperience: userProfile.yearsOfExperience || ''
      })
    }
    setIsEditing(false)
  }

  const businessTypes = [
    'Freelancer', 'Agency', 'Consultant', 'Small Business', 
    'Startup', 'Enterprise', 'Non-Profit', 'Other'
  ]

  const industries = [
    'Technology', 'Design', 'Marketing', 'Consulting', 'Finance',
    'Healthcare', 'Education', 'E-commerce', 'Real Estate', 'Legal',
    'Media', 'Entertainment', 'Manufacturing', 'Other'
  ]

  const teamSizes = [
    'Just me', '2-5', '6-10', '11-25', '26-50', '51-100', '100+'
  ]

  const experienceLevels = [
    'Beginner (0-1 years)', 'Intermediate (2-5 years)', 
    'Advanced (6-10 years)', 'Expert (10+ years)'
  ]

  const revenueRanges = [
    'Under $1K', '$1K - $5K', '$5K - $10K', '$10K - $25K',
    '$25K - $50K', '$50K - $100K', '$100K+'
  ]

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="border-b border-gray-800/50 bg-black/40 backdrop-blur-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light text-white mb-2">Profile Settings</h1>
              <p className="text-slate-400 font-light">Manage your personal and business information</p>
            </div>
            
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <motion.button
                    onClick={handleCancel}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={handleSave}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </motion.button>
                </>
              ) : (
                <motion.button
                  onClick={() => setIsEditing(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all duration-200"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <span className="text-2xl font-medium text-white">
                    {formData.firstName?.[0] || formData.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                {isEditing && (
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center hover:bg-white/90 transition-all duration-200">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-light text-white mb-1">
                  {formData.firstName} {formData.lastName}
                </h2>
                <p className="text-slate-400 mb-2">{formData.email}</p>
                {formData.businessName && (
                  <p className="text-sm text-slate-500">{formData.businessName}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-white" />
                <h3 className="text-xl font-light text-white">Personal Information</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                      placeholder="Enter your first name"
                    />
                  ) : (
                    <p className="text-white py-3">{formData.firstName || 'Not provided'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                      placeholder="Enter your last name"
                    />
                  ) : (
                    <p className="text-white py-3">{formData.lastName || 'Not provided'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <p className="text-white py-3">{formData.email}</p>
                    <span className="text-xs text-slate-500">(Cannot be changed)</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <p className="text-white py-3">{formData.phone || 'Not provided'}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location.city}
                      onChange={(e) => handleInputChange('location.city', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                      placeholder="Enter your city"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <p className="text-white py-3">{formData.location.city || 'Not provided'}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Country</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location.country}
                      onChange={(e) => handleInputChange('location.country', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                      placeholder="Enter your country"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <p className="text-white py-3">{formData.location.country || 'Not provided'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Business Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <Building2 className="w-5 h-5 text-white" />
                <h3 className="text-xl font-light text-white">Business Information</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                      placeholder="Enter your business name"
                    />
                  ) : (
                    <p className="text-white py-3">{formData.businessName || 'Not provided'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Business Type</label>
                  {isEditing ? (
                    <select
                      value={formData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                    >
                      <option value="">Select business type</option>
                      {businessTypes.map(type => (
                        <option key={type} value={type} className="bg-black">{type}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      <p className="text-white py-3">{formData.businessType || 'Not provided'}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
                  {isEditing ? (
                    <select
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                    >
                      <option value="">Select industry</option>
                      {industries.map(industry => (
                        <option key={industry} value={industry} className="bg-black">{industry}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-white py-3">{formData.industry || 'Not provided'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Team Size</label>
                  {isEditing ? (
                    <select
                      value={formData.teamSize}
                      onChange={(e) => handleInputChange('teamSize', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                    >
                      <option value="">Select team size</option>
                      {teamSizes.map(size => (
                        <option key={size} value={size} className="bg-black">{size}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <p className="text-white py-3">{formData.teamSize || 'Not provided'}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Experience Level</label>
                  {isEditing ? (
                    <select
                      value={formData.experienceLevel}
                      onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                    >
                      <option value="">Select experience level</option>
                      {experienceLevels.map(level => (
                        <option key={level} value={level} className="bg-black">{level}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-slate-400" />
                      <p className="text-white py-3">{formData.experienceLevel || 'Not provided'}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Monthly Revenue</label>
                  {isEditing ? (
                    <select
                      value={formData.monthlyRevenue}
                      onChange={(e) => handleInputChange('monthlyRevenue', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                    >
                      <option value="">Select revenue range</option>
                      {revenueRanges.map(range => (
                        <option key={range} value={range} className="bg-black">{range}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <p className="text-white py-3">{formData.monthlyRevenue || 'Not provided'}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Tools</label>
                {isEditing ? (
                  <textarea
                    value={formData.currentTools.join(', ')}
                    onChange={(e) => handleToolsChange(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 resize-none"
                    placeholder="Enter tools separated by commas (e.g., Figma, Slack, Notion)"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.currentTools.length > 0 ? (
                      formData.currentTools.map((tool, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-white/10 border border-white/20 rounded-full text-sm text-white"
                        >
                          {tool}
                        </span>
                      ))
                    ) : (
                      <p className="text-slate-400 py-3">No tools specified</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Professional Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl"
          >
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-white" />
                <h3 className="text-xl font-light text-white">Professional Details</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20 resize-none"
                      placeholder="Tell us about yourself and your work..."
                    />
                  ) : (
                    <p className="text-white py-3">{formData.bio || 'No bio provided'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                      placeholder="https://yourwebsite.com"
                    />
                  ) : (
                    <p className="text-white py-3">{formData.website || 'Not provided'}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">LinkedIn</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.linkedIn}
                      onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  ) : (
                    <p className="text-white py-3">{formData.linkedIn || 'Not provided'}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Profile 